'use strict';

const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const SESSION_COOKIE = 'cyberrota_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableId(value) {
  const input = stableStringify(value ?? null);
  let hash = 0xcbf29ce484222325n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = (hash * 0x100000001b3n) & mask;
  }
  return `legacy-${hash.toString(16).padStart(16, '0')}`;
}

function normalizeStats(value) {
  const stats = safeObject(value);
  const byTheme = {};
  for (const [theme, raw] of Object.entries(safeObject(stats.byTheme))) {
    const item = safeObject(raw);
    byTheme[theme] = {
      total: Math.max(0, Number(item.total) || 0),
      correct: Math.max(0, Number(item.correct) || 0),
    };
  }
  return {
    total: Math.max(0, Number(stats.total) || 0),
    correct: Math.max(0, Number(stats.correct) || 0),
    points: Math.max(0, Number(stats.points) || 0),
    byTheme,
  };
}

function normalizeProgress(input, options = {}) {
  const source = safeObject(input);
  const stats = normalizeStats(source.stats);
  const errors = asArray(source.errors).map((item) => ({ ...safeObject(item), id: String(item?.id || stableId(item)) }));
  const sessions = asArray(source.sessions).map((item) => ({ ...safeObject(item), id: String(item?.id || stableId(item)) }));
  const customDecks = asArray(source.customDecks).map((item) => ({ ...safeObject(item), id: String(item?.id || stableId(item)) }));
  const savedGames = asArray(source.savedGames).map((item) => ({ ...safeObject(item), id: String(item?.id || options.deviceId || stableId(item)) }));
  if (source.activeGame?.state) {
    const game = source.activeGame.state;
    const mode = game.mode || source.activeGame.mode;
    if (mode === 'solo') savedGames.push({ id: String(options.deviceId || stableId(game)), mode: 'solo', state: game, updatedAt: source.activeGame.updatedAt || null });
  } else if (source.savedGames === undefined && source.activeGame?.mode === 'solo') {
    savedGames.push({ id: String(options.deviceId || stableId(source.activeGame)), mode: 'solo', state: source.activeGame, updatedAt: null });
  }
  return {
    displayName: String(source.profile || source.displayName || 'Jogador convidado').trim().slice(0, 80) || 'Jogador convidado',
    stats,
    errors,
    sessions,
    customDecks,
    savedGames,
    usedIds: [...new Set(asArray(source.usedIds).map(String))],
  };
}

function mergeStats(left, right) {
  const a = normalizeStats(left);
  const b = normalizeStats(right);
  const byTheme = { ...a.byTheme };
  for (const [theme, values] of Object.entries(b.byTheme)) {
    const previous = byTheme[theme] || { total: 0, correct: 0 };
    byTheme[theme] = { total: previous.total + values.total, correct: previous.correct + values.correct };
  }
  return { total: a.total + b.total, correct: a.correct + b.correct, points: a.points + b.points, byTheme };
}

function mergeUnique(left, right) {
  const items = new Map();
  for (const item of [...asArray(left), ...asArray(right)]) {
    const normalized = { ...safeObject(item), id: String(item?.id || stableId(item)) };
    if (!items.has(normalized.id)) items.set(normalized.id, normalized);
  }
  return [...items.values()];
}

function mergeProgress(existingInput, incomingInput) {
  const existing = normalizeProgress(existingInput);
  const incoming = normalizeProgress(incomingInput);
  const currentNames = new Set(existing.customDecks.map((deck) => String(deck.name || '').trim().toLocaleLowerCase()));
  const customDecks = [...existing.customDecks];
  for (const deck of mergeUnique([], incoming.customDecks)) {
    let name = String(deck.name || 'Baralho importado').trim() || 'Baralho importado';
    if (currentNames.has(name.toLocaleLowerCase())) {
      const base = `${name} (importado)`;
      name = base;
      let suffix = 2;
      while (currentNames.has(name.toLocaleLowerCase())) name = `${base} ${suffix++}`;
    }
    currentNames.add(name.toLocaleLowerCase());
    customDecks.push({ ...deck, name });
  }
  return {
    displayName: existing.displayName !== 'Jogador convidado' ? existing.displayName : incoming.displayName,
    stats: mergeStats(existing.stats, incoming.stats),
    errors: mergeUnique(existing.errors, incoming.errors),
    sessions: mergeUnique(existing.sessions, incoming.sessions),
    customDecks,
    savedGames: mergeUnique(existing.savedGames, incoming.savedGames),
    usedIds: [...new Set([...existing.usedIds, ...incoming.usedIds])],
  };
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));
}

let cachedGoogleKeys = null;
let cachedGoogleKeysUntil = 0;

async function loadGoogleKeys(fetchImpl, nowMs) {
  if (cachedGoogleKeys && nowMs < cachedGoogleKeysUntil) return cachedGoogleKeys;
  const response = await fetchImpl(GOOGLE_KEYS_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Não foi possível obter as chaves públicas do Google.');
  const body = await response.json();
  const maxAge = Number(/max-age=(\d+)/i.exec(response.headers.get('cache-control') || '')?.[1]) || 300;
  cachedGoogleKeys = body.keys || [];
  cachedGoogleKeysUntil = nowMs + maxAge * 1000;
  return cachedGoogleKeys;
}

async function verifyGoogleIdToken(token, options = {}) {
  if (typeof token !== 'string' || token.length > 12000) throw new Error('Token do Google inválido.');
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error('Token do Google inválido.');
  let header;
  let claims;
  try {
    header = decodeJsonPart(parts[0]);
    claims = decodeJsonPart(parts[1]);
  } catch {
    throw new Error('Token do Google inválido.');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Assinatura do token do Google inválida.');
  const nowMs = options.nowMs ?? Date.now();
  const fetchImpl = options.fetchImpl || fetch;
  const keys = await loadGoogleKeys(fetchImpl, nowMs);
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Chave do token do Google não encontrada.');
  const cryptoApi = options.crypto || globalThis.crypto;
  const publicKey = await cryptoApi.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const signature = base64UrlDecode(parts[2]);
  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  if (!await cryptoApi.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signedData)) throw new Error('Assinatura do token do Google inválida.');
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!(claims.aud === options.clientId || (Array.isArray(claims.aud) && claims.aud.includes(options.clientId)))) throw new Error('Audiência do token do Google inválida.');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) throw new Error('Emissor do token do Google inválido.');
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds) throw new Error('Token do Google expirado.');
  if (claims.iat && claims.iat > nowSeconds + 300) throw new Error('Data de emissão do token do Google inválida.');
  if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Identidade do Google ausente.');
  return {
    subject: claims.sub,
    email: String(claims.email || '').slice(0, 320),
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    displayName: String(claims.name || claims.given_name || 'Jogador').slice(0, 80),
    avatarUrl: String(claims.picture || '').slice(0, 2048),
  };
}

function base64UrlEncode(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes));
  let binary = '';
  for (const byte of input) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importSessionKey(secret, cryptoApi = globalThis.crypto) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  return cryptoApi.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function createSessionToken(claims, secret, options = {}) {
  const cryptoApi = options.crypto || globalThis.crypto;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: nowSeconds, exp: claims.exp || nowSeconds + SESSION_TTL_SECONDS };
  const head = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${head}.${body}`;
  const key = await importSessionKey(secret, cryptoApi);
  const signature = await cryptoApi.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifySessionToken(token, secret, options = {}) {
  if (typeof token !== 'string' || token.length > 12000) throw new Error('Sessão inválida.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Sessão inválida.');
  const header = decodeJsonPart(parts[0]);
  if (header.alg !== 'HS256') throw new Error('Sessão inválida.');
  const cryptoApi = options.crypto || globalThis.crypto;
  const key = await importSessionKey(secret, cryptoApi);
  const valid = await cryptoApi.subtle.verify('HMAC', key, base64UrlDecode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new Error('Sessão inválida.');
  const claims = decodeJsonPart(parts[1]);
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds) throw new Error('Sessão expirada.');
  if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Sessão inválida.');
  return claims;
}

function makeSessionCookie(token, options = {}) {
  const maxAge = options.maxAge ?? SESSION_TTL_SECONDS;
  const secure = options.secure !== false;
  return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

function clearSessionCookie(options = {}) {
  return makeSessionCookie('', { ...options, maxAge: 0 });
}

function validateDoubleSubmitCsrf(cookieHeader, bodyToken) {
  const cookie = String(cookieHeader || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('g_csrf_token='))?.slice('g_csrf_token='.length);
  return Boolean(cookie && typeof bodyToken === 'string' && cookie === bodyToken);
}

async function findOrCreateGoogleAccount(db, claims) {
  const now = new Date().toISOString();
  const id = globalThis.crypto.randomUUID();
  await db.prepare(`INSERT INTO accounts (id, google_sub, email, email_verified, display_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email, email_verified=excluded.email_verified,
      display_name=excluded.display_name, avatar_url=excluded.avatar_url, updated_at=excluded.updated_at`)
    .bind(id, claims.subject, claims.email, claims.emailVerified ? 1 : 0, claims.displayName, claims.avatarUrl, now, now).run();
  return db.prepare('SELECT id, google_sub, email, email_verified, display_name, avatar_url, created_at FROM accounts WHERE google_sub = ?')
    .bind(claims.subject).first();
}

function parseRows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function loadAccountProgress(db, accountId) {
  const [account, stats, themes, sessions, errors, decks, games, usedQuestions] = await Promise.all([
    db.prepare('SELECT id, email, display_name, avatar_url, created_at, progress_revision FROM accounts WHERE id = ?').bind(accountId).first(),
    db.prepare('SELECT total, correct, points FROM account_stats WHERE account_id = ?').bind(accountId).first(),
    db.prepare('SELECT theme, total, correct FROM account_theme_stats WHERE account_id = ?').bind(accountId).all(),
    db.prepare('SELECT id, mode, played_at AS date, turns, outcome, players_json AS players, points, errors FROM game_sessions WHERE account_id = ? ORDER BY played_at DESC LIMIT 100').bind(accountId).all(),
    db.prepare('SELECT id, card_json, chosen, occurred_at AS date, repeats FROM answer_errors WHERE account_id = ? ORDER BY occurred_at DESC').bind(accountId).all(),
    db.prepare('SELECT id, name, cards_json AS cards FROM custom_decks WHERE account_id = ? ORDER BY name').bind(accountId).all(),
    db.prepare('SELECT device_id AS id, mode, state_json AS state, updated_at AS updatedAt FROM saved_games WHERE account_id = ? ORDER BY updated_at DESC').bind(accountId).all(),
    db.prepare('SELECT question_id FROM used_questions WHERE account_id = ?').bind(accountId).all(),
  ]);
  if (!account) return null;
  const byTheme = Object.fromEntries(parseRows(themes).map((item) => [item.theme, { total: item.total, correct: item.correct }]));
  return {
    id: account.id,
    email: account.email,
    displayName: account.display_name,
    avatarUrl: account.avatar_url,
    createdAt: account.created_at,
    revision: account.progress_revision || 0,
    stats: { total: stats?.total || 0, correct: stats?.correct || 0, points: stats?.points || 0, byTheme },
    sessions: parseRows(sessions).map((item) => ({ ...item, players: JSON.parse(item.players || '[]') })),
    errors: parseRows(errors).map((item) => ({ ...item, card: JSON.parse(item.card_json || '{}') })),
    customDecks: parseRows(decks).map((item) => ({ ...item, cards: JSON.parse(item.cards || '[]') })),
    savedGames: parseRows(games).map((item) => ({ ...item, state: JSON.parse(item.state || '{}') })),
    usedIds: parseRows(usedQuestions).map((item) => item.question_id),
  };
}

function importClaim(db, accountId, guestId, claim) {
  return db.prepare(`INSERT INTO guest_imports (account_id, guest_id, claim_token, imported_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(account_id, guest_id) DO NOTHING`).bind(accountId, guestId, claim, new Date().toISOString());
}

function guardedInsert(db, sql, accountId, claim, bindings, suffix = '') {
  return db.prepare(`${sql} SELECT ${bindings.map(() => '?').join(', ')} WHERE EXISTS (
    SELECT 1 FROM guest_imports WHERE account_id = ? AND claim_token = ?
  ) ${suffix}`).bind(...bindings, accountId, claim);
}

async function importGuestProgress(db, accountId, guestId, rawProgress, options = {}) {
  if (!accountId || !guestId) throw new Error('Conta e guestId são obrigatórios.');
  const progress = normalizeProgress(rawProgress, { deviceId: options.deviceId || guestId });
  const claim = globalThis.crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const statements = [importClaim(db, accountId, guestId, claim)];
  statements.push(db.prepare(`INSERT INTO account_stats (account_id, total, correct, points)
    SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM guest_imports WHERE account_id = ? AND claim_token = ?)
    ON CONFLICT(account_id) DO UPDATE SET total=account_stats.total+excluded.total,
      correct=account_stats.correct+excluded.correct, points=account_stats.points+excluded.points`)
    .bind(accountId, progress.stats.total, progress.stats.correct, progress.stats.points, accountId, claim));
  for (const [theme, values] of Object.entries(progress.stats.byTheme)) {
    statements.push(db.prepare(`INSERT INTO account_theme_stats (account_id, theme, total, correct)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM guest_imports WHERE account_id = ? AND claim_token = ?)
      ON CONFLICT(account_id, theme) DO UPDATE SET total=account_theme_stats.total+excluded.total,
        correct=account_theme_stats.correct+excluded.correct`).bind(accountId, theme, values.total, values.correct, accountId, claim));
  }

  for (const item of progress.sessions) {
    statements.push(guardedInsert(db, `INSERT OR IGNORE INTO game_sessions
      (id, account_id, mode, played_at, turns, outcome, players_json, points, errors)`, accountId, claim,
    [String(item.id), accountId, String(item.mode || 'solo'), String(item.date || timestamp), Number(item.turns) || 0,
      String(item.outcome || 'training'), JSON.stringify(item.players || []), Number(item.points) || 0, Number(item.errors) || 0]));
  }
  for (const item of progress.errors) {
    statements.push(guardedInsert(db, 'INSERT OR IGNORE INTO answer_errors (id, account_id, card_json, chosen, occurred_at, repeats)', accountId, claim,
      [String(item.id), accountId, JSON.stringify(item.card || {}), String(item.chosen || ''), String(item.date || timestamp), Number(item.repeats) || 0]));
  }
  for (const item of progress.customDecks) {
    const deckId = `guest:${encodeURIComponent(guestId)}:${encodeURIComponent(String(item.id))}`;
    const deckName = `${String(item.name || 'Baralho').slice(0, 68)} (importado)`;
    statements.push(guardedInsert(db, 'INSERT OR IGNORE INTO custom_decks (id, account_id, name, cards_json, created_at)', accountId, claim,
      [deckId, accountId, deckName, JSON.stringify(item.cards || []), timestamp]));
  }
  for (const item of progress.savedGames) {
    if (item.mode !== 'solo' || !item.state) continue;
    statements.push(guardedInsert(db, 'INSERT INTO saved_games (account_id, device_id, mode, state_json, updated_at)', accountId, claim,
      [accountId, String(item.id), 'solo', JSON.stringify(item.state), String(item.updatedAt || timestamp)],
      'ON CONFLICT(account_id, device_id) DO UPDATE SET mode=excluded.mode, state_json=excluded.state_json, updated_at=excluded.updated_at'));
  }
  for (const usedId of progress.usedIds) {
    statements.push(guardedInsert(db, 'INSERT OR IGNORE INTO used_questions (account_id, question_id)', accountId, claim, [accountId, usedId]));
  }
  statements.push(db.prepare(`UPDATE guest_imports SET imported_at = ? WHERE account_id = ? AND guest_id = ? AND claim_token = ?`)
    .bind(timestamp, accountId, guestId, claim));
  const result = await db.batch(statements);
  const first = result?.[0];
  const inserted = Number(first?.meta?.changes || 0) > 0;
  return { imported: inserted, guestId, progress: inserted ? progress : null };
}

async function saveAccountProgress(db, accountId, rawProgress, options = {}) {
  const progress = normalizeProgress(rawProgress, options);
  const existing = await loadAccountProgress(db, accountId);
  if (!existing) throw new Error('Conta não encontrada.');
  const expectedRevision = Number(options.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision !== Number(existing.revision)) {
    const error = new Error('O progresso da conta foi atualizado em outro dispositivo. Recarregue os dados e tente novamente.');
    error.code = 'PROGRESS_CONFLICT';
    throw error;
  }
  const timestamp = new Date().toISOString();
  const writeToken = globalThis.crypto.randomUUID();
  const gate = 'EXISTS (SELECT 1 FROM accounts WHERE id = ? AND progress_write_token = ?)';
  const statements = [db.prepare(`UPDATE accounts SET display_name = ?, updated_at = ?, progress_revision = progress_revision + 1,
      progress_write_token = ? WHERE id = ? AND progress_revision = ?`)
    .bind(progress.displayName, timestamp, writeToken, accountId, expectedRevision)];
  for (const table of ['account_stats', 'account_theme_stats', 'game_sessions', 'answer_errors', 'custom_decks', 'saved_games', 'used_questions']) {
    statements.push(db.prepare(`DELETE FROM ${table} WHERE account_id = ? AND ${gate}`).bind(accountId, accountId, writeToken));
  }
  statements.push(db.prepare('INSERT INTO account_stats (account_id, total, correct, points) SELECT ?, ?, ?, ? WHERE ' + gate)
    .bind(accountId, progress.stats.total, progress.stats.correct, progress.stats.points, accountId, writeToken));
  for (const [theme, values] of Object.entries(progress.stats.byTheme)) {
    statements.push(db.prepare('INSERT INTO account_theme_stats (account_id, theme, total, correct) SELECT ?, ?, ?, ? WHERE ' + gate)
      .bind(accountId, theme, values.total, values.correct, accountId, writeToken));
  }
  for (const item of progress.sessions) {
    statements.push(db.prepare('INSERT OR IGNORE INTO game_sessions (account_id, id, mode, played_at, turns, outcome, players_json, points, errors) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ' + gate)
      .bind(accountId, String(item.id), String(item.mode || 'solo'), String(item.date || timestamp), Number(item.turns) || 0, String(item.outcome || 'training'), JSON.stringify(item.players || []), Number(item.points) || 0, Number(item.errors) || 0, accountId, writeToken));
  }
  for (const item of progress.errors) {
    statements.push(db.prepare('INSERT OR IGNORE INTO answer_errors (account_id, id, card_json, chosen, occurred_at, repeats) SELECT ?, ?, ?, ?, ?, ? WHERE ' + gate)
      .bind(accountId, String(item.id), JSON.stringify(item.card || {}), String(item.chosen || ''), String(item.date || timestamp), Number(item.repeats) || 0, accountId, writeToken));
  }
  for (const item of progress.customDecks) {
    statements.push(db.prepare('INSERT OR IGNORE INTO custom_decks (account_id, id, name, cards_json, created_at) SELECT ?, ?, ?, ?, ? WHERE ' + gate)
      .bind(accountId, String(item.id), String(item.name || 'Baralho').slice(0, 80), JSON.stringify(item.cards || []), timestamp, accountId, writeToken));
  }
  for (const item of progress.savedGames) {
    if (item.mode !== 'solo' || !item.state) continue;
    statements.push(db.prepare('INSERT OR IGNORE INTO saved_games (account_id, device_id, mode, state_json, updated_at) SELECT ?, ?, ?, ?, ? WHERE ' + gate)
      .bind(accountId, String(item.id), 'solo', JSON.stringify(item.state), String(item.updatedAt || timestamp), accountId, writeToken));
  }
  for (const questionId of progress.usedIds) {
    statements.push(db.prepare('INSERT OR IGNORE INTO used_questions (account_id, question_id) SELECT ?, ? WHERE ' + gate)
      .bind(accountId, questionId, accountId, writeToken));
  }
  const result = await db.batch(statements);
  if (Number(result?.[0]?.meta?.changes || 0) === 0) {
    const error = new Error('O progresso da conta foi atualizado em outro dispositivo. Recarregue os dados e tente novamente.');
    error.code = 'PROGRESS_CONFLICT';
    throw error;
  }
  return { ...progress, revision: expectedRevision + 1 };
}

async function exportAccountProgress(db, accountId) {
  const progress = await loadAccountProgress(db, accountId);
  if (!progress) throw new Error('Conta não encontrada.');
  return { version: 1, exportedAt: new Date().toISOString(), account: { displayName: progress.displayName }, ...progress };
}

async function listAccountRooms(db, accountId) {
  if (!accountId) throw new Error('Conta obrigatória.');
  const result = await db.prepare(`SELECT room_code AS roomCode, player_id AS playerId, is_host AS isHost
    FROM account_rooms WHERE account_id = ? ORDER BY is_host DESC, room_code ASC, player_id ASC`).bind(accountId).all();
  return parseRows(result).map((room) => ({ ...room, isHost: Boolean(room.isHost) }));
}

async function deleteAccountData(db, accountId, transferOwnedRooms = async () => {}) {
  if (!accountId) throw new Error('Conta obrigatória.');
  await transferOwnedRooms(accountId);
  const result = await db.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId).run();
  return { deleted: Number(result?.meta?.changes || 0) > 0 };
}

async function authenticateGoogleCredential(db, credential, env, options = {}) {
  const claims = await verifyGoogleIdToken(credential, { clientId: env.GOOGLE_CLIENT_ID, fetchImpl: options.fetchImpl, nowMs: options.nowMs, crypto: options.crypto });
  const account = await findOrCreateGoogleAccount(db, claims);
  const now = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const token = await createSessionToken({ sub: account.id, role: 'account' }, env.SESSION_SECRET, { nowSeconds: now, crypto: options.crypto });
  return { account: { id: account.id, displayName: account.display_name, email: account.email, avatarUrl: account.avatar_url }, token };
}

async function createGuestSessionToken(guestId, displayName, env, options = {}) {
  const id = String(guestId || '').trim();
  if (!id || id.length > 100) throw new Error('Identificador de convidado inválido.');
  const now = Math.floor((options.nowMs ?? Date.now()) / 1000);
  return createSessionToken({ sub: `guest:${id}`, role: 'guest', displayName: String(displayName || 'Convidado').trim().slice(0, 80) || 'Convidado' }, env.SESSION_SECRET, {
    nowSeconds: now,
    crypto: options.crypto,
  });
}

async function readSessionClaims(request, env, options = {}) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  try {
    return await verifySessionToken(token, env.SESSION_SECRET, options);
  } catch {
    return null;
  }
}

async function getSessionAccount(request, env, options = {}) {
  const claims = await readSessionClaims(request, env, options);
  if (!claims || claims.role !== 'account') return null;
  return env.DB.prepare('SELECT id, email, display_name, avatar_url FROM accounts WHERE id = ?').bind(claims.sub).first();
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  normalizeProgress,
  normalizeStats,
  mergeProgress,
  stableId,
  verifyGoogleIdToken,
  createSessionToken,
  verifySessionToken,
  makeSessionCookie,
  clearSessionCookie,
  validateDoubleSubmitCsrf,
  findOrCreateGoogleAccount,
  loadAccountProgress,
  importGuestProgress,
  saveAccountProgress,
  exportAccountProgress,
  listAccountRooms,
  deleteAccountData,
  authenticateGoogleCredential,
  createGuestSessionToken,
  readSessionClaims,
  getSessionAccount,
};
