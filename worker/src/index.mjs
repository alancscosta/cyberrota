import Accounts from '../../server/src/accounts.js';
import { RoomDurableObject, generateRoomCode } from './rooms.mjs';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { ...JSON_HEADERS, ...headers } });
}

function errorResponse(error) {
  const status = error.status || (error.code === 'PROGRESS_CONFLICT' ? 409 : error.code ? 400 : 500);
  const message = status >= 500 ? 'Ocorreu um erro interno. Tente novamente.' : error.message || 'Não foi possível concluir a solicitação.';
  return json({ error: error.code || 'REQUEST_FAILED', message }, status);
}

async function readBody(request) {
  try { return await request.json(); }
  catch { const error = new Error('Envie um JSON válido.'); error.status = 400; error.code = 'INVALID_JSON'; throw error; }
}

function requireSecret(env) {
  if (!env.SESSION_SECRET || String(env.SESSION_SECRET).length < 32) {
    const error = new Error('A sessão ainda não está configurada neste ambiente.'); error.status = 503; error.code = 'AUTH_NOT_CONFIGURED'; throw error;
  }
}

async function requireAccount(request, env) {
  requireSecret(env);
  const account = await Accounts.getSessionAccount(request, env);
  if (!account) { const error = new Error('Entre na sua conta para continuar.'); error.status = 401; error.code = 'AUTH_REQUIRED'; throw error; }
  return account;
}

async function syncAccountRooms(db, code, members) {
  if (!db || !code || !Array.isArray(members)) return;
  const statements = [db.prepare('DELETE FROM account_rooms WHERE room_code = ?').bind(code)];
  for (const player of members) {
    if (!player.playerId || !player.accountId) continue;
    statements.push(db.prepare(`INSERT INTO account_rooms (account_id, room_code, player_id, is_host) VALUES (?, ?, ?, ?)
      ON CONFLICT(account_id, room_code, player_id) DO UPDATE SET is_host=excluded.is_host`)
      .bind(player.accountId, code, player.playerId, player.isHost ? 1 : 0));
  }
  await db.batch(statements);
}

function publicRoomResult(payload) {
  const result = { ...payload };
  delete result.accountRooms;
  if (result.player) {
    result.player = { ...result.player };
    delete result.player.accountId;
  }
  return result;
}

function roomStub(env, code) {
  if (!env.ROOMS) { const error = new Error('Salas online ainda não estão configuradas.'); error.status = 503; error.code = 'ROOMS_NOT_CONFIGURED'; throw error; }
  return env.ROOMS.getByName(code);
}

function internalRoomRequest(url, method, body) {
  return new Request(`https://room.internal${url}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function doRoomRequest(request, env, code, path, options = {}) {
  const stub = roomStub(env, code);
  let upstream;
  if (options.websocket) {
    const target = new URL(`https://room.internal/${path}`);
    upstream = await stub.fetch(new Request(target, request));
  } else {
    const response = await stub.fetch(internalRoomRequest(`/${path}`, options.method || request.method, options.body));
    const payload = await response.json().catch(() => ({}));
    if (payload.snapshot) await syncAccountRooms(env.DB, code, payload.accountRooms);
    return json(publicRoomResult(payload), response.status);
  }
  return upstream;
}

async function routeAccount(request, env, path) {
  if (request.method === 'GET' && path === '/api/account/csrf') {
    const token = crypto.randomUUID() + crypto.randomUUID();
    const secure = new URL(request.url).protocol === 'https:';
    return json({ csrfToken: token }, 200, { 'set-cookie': `g_csrf_token=${token}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}` });
  }
  if (request.method === 'POST' && path === '/api/account/guest') {
    requireSecret(env);
    const body = await readBody(request);
    const token = await Accounts.createGuestSessionToken(body.guestId, body.displayName, env);
    return json({ role: 'guest' }, 200, { 'set-cookie': Accounts.makeSessionCookie(token, { secure: new URL(request.url).protocol === 'https:' }) });
  }
  if (request.method === 'POST' && path === '/api/account/google') {
    requireSecret(env);
    if (!env.GOOGLE_CLIENT_ID) { const error = new Error('Login Google ainda não está configurado.'); error.status = 503; error.code = 'GOOGLE_LOGIN_NOT_CONFIGURED'; throw error; }
    const body = await readBody(request);
    if (!Accounts.validateDoubleSubmitCsrf(request.headers.get('cookie'), body.csrfToken)) {
      const error = new Error('Não foi possível validar a solicitação de login.'); error.status = 403; error.code = 'CSRF_REJECTED'; throw error;
    }
    const session = await Accounts.authenticateGoogleCredential(env.DB, body.credential, env);
    return json({ account: session.account }, 200, { 'set-cookie': Accounts.makeSessionCookie(session.token, { secure: new URL(request.url).protocol === 'https:' }) });
  }
  if (request.method === 'POST' && path === '/api/account/logout') {
    return json({ ok: true }, 200, { 'set-cookie': Accounts.clearSessionCookie({ secure: new URL(request.url).protocol === 'https:' }) });
  }
  const account = await requireAccount(request, env);
  if (request.method === 'GET' && path === '/api/account/me') return json({ account });
  if (request.method === 'GET' && path === '/api/account/progress') {
    const progress = await Accounts.loadAccountProgress(env.DB, account.id);
    return json({ progress });
  }
  if (request.method === 'PUT' && path === '/api/account/progress') {
    const body = await readBody(request);
    const progress = await Accounts.saveAccountProgress(env.DB, account.id, body.progress, { expectedRevision: body.revision });
    return json({ progress });
  }
  if (request.method === 'POST' && path === '/api/account/import-guest') {
    const body = await readBody(request);
    const result = await Accounts.importGuestProgress(env.DB, account.id, body.guestId, body.progress, { deviceId: body.deviceId });
    return json({ result, progress: await Accounts.loadAccountProgress(env.DB, account.id) });
  }
  if (request.method === 'GET' && path === '/api/account/export') {
    const data = await Accounts.exportAccountProgress(env.DB, account.id);
    return new Response(JSON.stringify(data, null, 2), { headers: { ...JSON_HEADERS, 'content-disposition': 'attachment; filename="cyberrota-dados.json"' } });
  }
  if (request.method === 'DELETE' && path === '/api/account') {
    const result = await Accounts.deleteAccountData(env.DB, account.id, async (accountId) => {
      const rooms = await Accounts.listAccountRooms(env.DB, accountId);
      for (const room of rooms.filter((entry) => entry.isHost)) {
        const stub = roomStub(env, room.roomCode);
        if (typeof stub.transferHostForDeletedAccount !== 'function') throw new Error(`A sala ${room.roomCode} ainda não permite transferir o anfitrião.`);
        const transfer = await stub.transferHostForDeletedAccount(accountId);
        if (transfer) await syncAccountRooms(env.DB, room.roomCode, transfer.accountRooms);
      }
    });
    return json(result, 200, { 'set-cookie': Accounts.clearSessionCookie({ secure: new URL(request.url).protocol === 'https:' }) });
  }
  const error = new Error('Rota de conta não encontrada.'); error.status = 404; error.code = 'NOT_FOUND'; throw error;
}

async function routeRoom(request, env, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 2 && request.method === 'POST') {
    const body = await readBody(request);
    const account = await Accounts.getSessionAccount(request, env);
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const code = generateRoomCode();
      const host = { playerId: crypto.randomUUID(), resumeToken: crypto.randomUUID() + crypto.randomUUID(), accountId: account?.id || null, name: body.name, colorIndex: body.colorIndex };
      const response = await roomStub(env, code).fetch(internalRoomRequest('/initialize', 'POST', {
        code, mode: body.mode, capacity: body.capacity, host, config: body.config, createdAt: Date.now(),
      }));
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        await syncAccountRooms(env.DB, code, result.accountRooms);
        return json(publicRoomResult(result), response.status);
      }
      if (result.error !== 'ROOM_ALREADY_INITIALIZED') return json(result, response.status);
    }
    const error = new Error('Não foi possível gerar um código livre. Tente novamente.'); error.status = 503; error.code = 'ROOM_CODE_RETRY'; throw error;
  }
  if (parts.length < 3) { const error = new Error('Rota de sala inválida.'); error.status = 404; error.code = 'NOT_FOUND'; throw error; }
  const code = String(parts[2]).toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) { const error = new Error('Código de sala inválido.'); error.status = 400; error.code = 'INVALID_CODE'; throw error; }
  const suffix = parts.slice(3).join('/');
  if (suffix === 'ws' && request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return doRoomRequest(request, env, code, 'ws', { websocket: true });
  }
  if (!suffix && request.method === 'GET') return doRoomRequest(request, env, code, 'snapshot', { method: 'GET' });
  if (suffix === 'join' && request.method === 'POST') {
    const body = await readBody(request);
    const account = await Accounts.getSessionAccount(request, env);
    return doRoomRequest(request, env, code, 'join', { method: 'POST', body: { ...body, accountId: account?.id || null } });
  }
  if (suffix === 'command' && request.method === 'POST') {
    const body = await readBody(request);
    return doRoomRequest(request, env, code, 'command', { method: 'POST', body });
  }
  const error = new Error('Rota de sala não encontrada.'); error.status = 404; error.code = 'NOT_FOUND'; throw error;
}

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  try {
    if (url.pathname === '/api/config' && request.method === 'GET') return json({ googleClientId: env.GOOGLE_CLIENT_ID || null });
    if (url.pathname.startsWith('/api/account')) return await routeAccount(request, env, url.pathname);
    if (url.pathname === '/api/rooms' || url.pathname.startsWith('/api/rooms/')) return await routeRoom(request, env, url);
    return json({ error: 'NOT_FOUND', message: 'Rota não encontrada.' }, 404);
  } catch (error) { return errorResponse(error); }
}

export class CyberrotaWorkerRoom extends RoomDurableObject {}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApiRequest(request, env);
    if (!env.ASSETS) return json({ error: 'ASSETS_NOT_CONFIGURED', message: 'Arquivos do app não estão disponíveis.' }, 503);
    return env.ASSETS.fetch(request);
  },
};
