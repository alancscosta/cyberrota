import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from '../worker/src/index.mjs';

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

test('malformed account payloads return a client error', async () => {
  const request = new Request('https://cyberrota.test/api/account/guest', { method: 'POST', body: '{' });
  const response = await handleApiRequest(request, { SESSION_SECRET: 'a-valid-test-secret-with-at-least-32-characters' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'INVALID_JSON');
});
