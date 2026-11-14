import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from '../worker/src/index.mjs';
import Accounts from '../server/src/accounts.js';

test('public config reveals only the optional Google client id', async () => {
  const response = await handleApiRequest(new Request('https://cyberrota.test/api/config'), {
    GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com', SESSION_SECRET: 'must-not-leak',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { googleClientId: 'client-id.apps.googleusercontent.com' });
});

test('protected progress route rejects anonymous sessions', async () => {
  const response = await handleApiRequest(new Request('https://cyberrota.test/api/account/progress'), {
    SESSION_SECRET: 'a-valid-test-secret-with-at-least-32-characters', DB: {},
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'AUTH_REQUIRED');
});

test('account identity returns Google name and avatar with stable client field names', async () => {
  const secret = 'a-valid-test-secret-with-at-least-32-characters';
  const token = await Accounts.createSessionToken({ sub: 'account-1', role: 'account' }, secret);
  const DB = { prepare: () => ({ bind: () => ({ first: async () => ({
    id: 'account-1', email: 'ana@example.com', display_name: 'Ana', avatar_url: 'https://lh3.googleusercontent.com/ana.png',
  }) }) }) };
  const response = await handleApiRequest(new Request('https://cyberrota.test/api/account/me', {
    headers: { cookie: Accounts.makeSessionCookie(token) },
  }), { SESSION_SECRET: secret, DB });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { account: {
    id: 'account-1', email: 'ana@example.com', displayName: 'Ana', avatarUrl: 'https://lh3.googleusercontent.com/ana.png',
  } });
});

test('room creation ignores caller account ids and initializes a private host seat', async () => {
  let initialization;
  const namespace = { getByName: () => ({ fetch: async (request) => {
    assert.equal(new URL(request.url).pathname, '/initialize');
    initialization = await request.json();
    return Response.json({ snapshot: { code: initialization.code, hostPlayerId: initialization.host.playerId, players: [{ ...initialization.host, connected: true }] }, player: initialization.host });
  } }) };
  const request = new Request('https://cyberrota.test/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'coop', capacity: 4, name: 'Mila', colorIndex: 0, accountId: 'spoofed' }) });
  const response = await handleApiRequest(request, { SESSION_SECRET: 'a-valid-test-secret-with-at-least-32-characters', ROOMS: namespace });
  assert.equal(response.status, 200);
  assert.match(initialization.code, /^(?=(?:[^A-Z]*[A-Z]){3}[^A-Z]*$)(?=(?:[^2-9]*[2-9]){3}[^2-9]*$)[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(initialization.host.accountId, null);
  assert.equal(initialization.host.name, 'Mila');
  assert.ok(initialization.host.resumeToken.length >= 32);
});

test('rotating a room retries occupied codes and transfers the same human seats', async () => {
  const generatedCodes = [];
  const occupiedCodes = new Set();
  let rotations = 0;
  const oldStub = { fetch: async (request) => {
    const path = new URL(request.url).pathname;
    const body = await request.json();
    if (path === '/rotation/prepare') {
      rotations += 1;
      generatedCodes.push(body.targetCode);
      return Response.json({ rotationToken: `rotation-${rotations}`, room: {
        code: 'ABC234', mode: 'coop', capacity: 2, status: 'lobby', revision: rotations,
        hostPlayerId: 'host', createdAt: 1, updatedAt: 1, config: { deck: [] }, gameState: null,
        players: [{ playerId: 'host', accountId: 'acct', resumeToken: 'host-secret', name: 'Ana', colorIndex: 0, connected: true }],
      } });
    }
    if (path === '/rotation/cancel') return Response.json({ cancelled: true });
    if (path === '/rotation/commit') return Response.json({ newCode: body.newCode, snapshot: { code: body.newCode, status: 'lobby', players: [{ playerId: 'host' }] } });
    throw new Error(`Unexpected old-room route ${path}`);
  } };
  const namespace = { getByName: (code) => {
    if (code === 'ABC234') return oldStub;
    return { fetch: async (request) => {
      const body = await request.json();
      assert.equal(body.room.code, code);
      if (occupiedCodes.has(code)) return Response.json({ error: 'ROOM_ALREADY_INITIALIZED' }, { status: 409 });
      occupiedCodes.add(code);
      if (generatedCodes.length === 1) return Response.json({ error: 'ROOM_ALREADY_INITIALIZED' }, { status: 409 });
      return Response.json({ snapshot: { code, status: 'lobby', players: [{ playerId: 'host' }] }, accountRooms: [{ accountId: 'acct', roomCode: code, playerId: 'host', isHost: true }] });
    } };
  } };
  const request = new Request('https://cyberrota.test/api/rooms/ABC234/rotate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resumeToken: 'host-secret' }) });
  const response = await handleApiRequest(request, { SESSION_SECRET: 'a-valid-test-secret-with-at-least-32-characters', ROOMS: namespace });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(rotations, 2);
  assert.notEqual(generatedCodes[0], generatedCodes[1]);
  assert.match(result.newCode, /^(?=(?:[^A-Z]*[A-Z]){3}[^A-Z]*$)(?=(?:[^2-9]*[2-9]){3}[^2-9]*$)[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(result.snapshot.code, result.newCode);
});

test('malformed account payloads return a client error', async () => {
  const request = new Request('https://cyberrota.test/api/account/guest', { method: 'POST', body: '{' });
  const response = await handleApiRequest(request, { SESSION_SECRET: 'a-valid-test-secret-with-at-least-32-characters' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'INVALID_JSON');
});
