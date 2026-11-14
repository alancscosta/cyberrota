const test = require('node:test');
const assert = require('node:assert/strict');

const Accounts = require('../src/accounts.js');
const crypto = globalThis.crypto;

function encodePart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function signGoogleToken(claims, privateKey, kid = 'test-key') {
  const head = encodePart({ alg: 'RS256', kid, typ: 'JWT' });
  const body = encodePart(claims);
  const input = `${head}.${body}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(input));
  return `${input}.${Buffer.from(signature).toString('base64url')}`;
}

test('normalizes the current browser store without dropping progress collections', () => {
  const data = Accounts.normalizeProgress({
    profile: 'Ana',
    stats: { total: 8, correct: 5, points: 9, byTheme: { rede: { total: 4, correct: 3 } } },
    errors: [{ card: { id: 'q1' }, chosen: 'A' }],
    customDecks: [{ id: 'd1', name: 'Redes', cards: [{ id: 'q1' }] }],
    sessions: [{ mode: 'solo', date: '2026-11-13', outcome: 'win' }],
    usedIds: ['q1'],
    activeGame: { mode: 'solo', state: { turns: 2 } },
  });

  assert.equal(data.displayName, 'Ana');
  assert.equal(data.stats.total, 8);
  assert.equal(data.errors.length, 1);
  assert.equal(data.customDecks.length, 1);
  assert.equal(data.sessions.length, 1);
  assert.equal(data.savedGames.length, 1);
});

test('guest merge adds statistics, deduplicates imported history and preserves colliding decks', () => {
  const current = Accounts.normalizeProgress({
    profile: 'Conta',
    stats: { total: 2, correct: 1, points: 1, byTheme: { rede: { total: 2, correct: 1 } } },
    errors: [{ id: 'same-error', card: { id: 'q1' }, chosen: 'A' }],
    customDecks: [{ id: 'existing', name: 'Redes', cards: [] }],
    sessions: [{ id: 'same-session', mode: 'solo', date: '2026-11-13' }],
  });
  const incoming = Accounts.normalizeProgress({
    profile: 'Convidada',
    stats: { total: 3, correct: 2, points: 4, byTheme: { rede: { total: 3, correct: 2 } } },
    errors: [{ id: 'same-error', card: { id: 'q1' }, chosen: 'A' }],
    customDecks: [{ id: 'guest-deck', name: 'Redes', cards: [{ id: 'q2' }] }],
    sessions: [{ id: 'same-session', mode: 'solo', date: '2026-11-13' }, { id: 'new-session', mode: 'coop' }],
  });

  const merged = Accounts.mergeProgress(current, incoming);
  assert.equal(merged.stats.total, 5);
  assert.equal(merged.stats.correct, 3);
  assert.equal(merged.stats.byTheme.rede.total, 5);
  assert.equal(merged.errors.length, 1);
  assert.equal(merged.sessions.length, 2);
  assert.equal(merged.customDecks.length, 2);
  assert.match(merged.customDecks[1].name, /importado/i);
});

test('same guest import is idempotent through D1 batch contract', async () => {
  const calls = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return { sql, values };
        },
      };
    },
    async batch(statements) {
      calls.push(statements);
      return statements.map((statement, index) => ({ meta: { changes: index === 0 ? 1 : 1 } }));
    },
  };

  const result = await Accounts.importGuestProgress(db, 'account-1', 'guest-1', {
    profile: 'Ana', stats: { total: 1, correct: 1, points: 1 }, sessions: [], errors: [], customDecks: [],
  });

  assert.equal(result.imported, true);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].length >= 2);
  assert.ok(calls[0].every((statement) => typeof statement.sql === 'string'));
});

test('rejects malformed Google tokens before attempting key lookup', async () => {
  await assert.rejects(
    Accounts.verifyGoogleIdToken('not-a-jwt', { clientId: 'web-client', fetchImpl: async () => { throw new Error('should not fetch'); } }),
    /token/i,
  );
});

test('verifies Google signatures and required token claims before returning account identity', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  Object.assign(jwk, { kid: 'valid-key', alg: 'RS256', use: 'sig' });
  const fetchImpl = async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'public, max-age=60' } });
  const now = 1_800_000_000;
  const claims = { sub: 'google-sub-1', aud: 'web-client', iss: 'https://accounts.google.com', exp: now + 120, iat: now - 10, email: 'ana@example.com', email_verified: true, name: 'Ana' };
  const token = await signGoogleToken(claims, pair.privateKey, 'valid-key');
  const identity = await Accounts.verifyGoogleIdToken(token, { clientId: 'web-client', fetchImpl, nowMs: now * 1000 });
  assert.equal(identity.subject, 'google-sub-1');
  assert.equal(identity.emailVerified, true);

  const wrongAudience = await signGoogleToken({ ...claims, aud: 'other-client' }, pair.privateKey, 'valid-key');
  await assert.rejects(Accounts.verifyGoogleIdToken(wrongAudience, { clientId: 'web-client', fetchImpl, nowMs: now * 1000 }), /audiência/i);

  const wrongSignature = await signGoogleToken(claims, pair.privateKey, 'unknown-key');
  await assert.rejects(Accounts.verifyGoogleIdToken(wrongSignature, { clientId: 'web-client', fetchImpl, nowMs: now * 1000 }), /chave/i);
});

test('double-submit CSRF validation requires matching Google cookie and request token', () => {
  assert.equal(Accounts.validateDoubleSubmitCsrf('g_csrf_token=csrf-1; other=value', 'csrf-1'), true);
  assert.equal(Accounts.validateDoubleSubmitCsrf('g_csrf_token=csrf-1', 'csrf-2'), false);
  assert.equal(Accounts.validateDoubleSubmitCsrf('', 'csrf-1'), false);
});

test('application sessions are signed, readable and reject tampering', async () => {
  const token = await Accounts.createSessionToken({ sub: 'account-1', exp: 1_900_000_000 }, 'a'.repeat(32));
  const decoded = await Accounts.verifySessionToken(token, 'a'.repeat(32), { nowSeconds: 1_800_000_000 });
  assert.equal(decoded.sub, 'account-1');
  await assert.rejects(Accounts.verifySessionToken(`${token.slice(0, 20)}x${token.slice(21)}`, 'a'.repeat(32), { nowSeconds: 1_800_000_000 }));
  await assert.rejects(Accounts.verifySessionToken(token, 'b'.repeat(32), { nowSeconds: 1_800_000_000 }));
});

test('guest sessions carry a stable guest principal without requiring an account row', async () => {
  const env = { SESSION_SECRET: 'g'.repeat(32) };
  const token = await Accounts.createGuestSessionToken('guest-123', 'Convidada', env, { nowMs: 1_800_000_000_000 });
  const request = new Request('https://cyberrota.test/', { headers: { cookie: `${Accounts.SESSION_COOKIE}=${token}` } });
  const claims = await Accounts.readSessionClaims(request, env, { nowSeconds: 1_800_000_001 });
  assert.equal(claims.sub, 'guest:guest-123');
  assert.equal(claims.role, 'guest');
  assert.equal(claims.displayName, 'Convidada');
  assert.match(Accounts.makeSessionCookie(token), /HttpOnly/);
  assert.match(Accounts.makeSessionCookie(token), /Secure/);
});

test('lists every account room with host membership first', async () => {
  let query;
  let bound;
  const db = {
    prepare(sql) {
      query = sql;
      return {
        bind(...values) {
          bound = values;
          return { all: async () => ({ results: [
            { roomCode: 'R7K2Q9', playerId: 'player-1', isHost: 1 },
            { roomCode: 'A3B4C5', playerId: 'player-2', isHost: 0 },
          ] }) };
        },
      };
    },
  };

  const rooms = await Accounts.listAccountRooms(db, 'account-1');
  assert.deepEqual(bound, ['account-1']);
  assert.match(query, /FROM account_rooms WHERE account_id = \?/);
  assert.deepEqual(rooms.map(({ roomCode, playerId, isHost }) => ({ roomCode, playerId, isHost })), [
    { roomCode: 'R7K2Q9', playerId: 'player-1', isHost: true },
    { roomCode: 'A3B4C5', playerId: 'player-2', isHost: false },
  ]);
});

