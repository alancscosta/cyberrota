import test from 'node:test';
import assert from 'node:assert/strict';
import * as roomClient from '../dist/room-client.js';
const { RoomClient, availableRoomColors, needsEarlyStartConfirmation, roomShareUrl, roomUrlWithoutCode, roomWebSocketUrl, canReuseActiveRoom, canAutoResumeRoom } = roomClient;

test('lobby color options hide characters selected by other people', () => {
  const room = { players: [{ playerId: 'a', colorIndex: 0 }, { playerId: 'b', colorIndex: 1 }] };
  assert.deepEqual(availableRoomColors(room, 'a').map((color) => color.index), [0, 2, 3, 4, 5]);
});

test('lobby asks confirmation while seats remain and not after filling capacity', () => {
  assert.equal(needsEarlyStartConfirmation({ capacity: 6, players: [{ isBot: false }, { isBot: false }] }), true);
  assert.equal(needsEarlyStartConfirmation({ capacity: 2, players: [{ isBot: false }, { isBot: false }] }), false);
});

test('share link carries the room code in the URL while preserving existing parameters', () => {
  assert.equal(roomShareUrl('abc234', 'https://game.example/?from=friend'), 'https://game.example/?from=friend&sala=ABC234');
});

test('leaving a room removes only its code from the current URL', () => {
  assert.equal(roomUrlWithoutCode('https://game.example/play?sala=ABC234&from=friend#board'), 'https://game.example/play?from=friend#board');
});

test('production WebSockets connect directly to the room Worker while local development stays same-origin', () => {
  assert.equal(roomWebSocketUrl('ABC234', '', 'https://cyberrota.vercel.app'), 'wss://cyberrota.cyberrota.workers.dev/api/rooms/ABC234/ws');
  assert.equal(roomWebSocketUrl('ABC234', '', 'https://cyberrota-git-fix.vercel.app'), 'wss://cyberrota.cyberrota.workers.dev/api/rooms/ABC234/ws');
  assert.equal(roomWebSocketUrl('ABC234', '', 'http://localhost:5173'), 'ws://localhost:5173/api/rooms/ABC234/ws');
});

test('a different mode or a finished room cannot hijack the newly opened mode picker', () => {
  assert.equal(canReuseActiveRoom({ closedByUser: false, snapshot: { mode: 'coop', status: 'playing' } }, 'coop'), true);
  assert.equal(canReuseActiveRoom({ closedByUser: false, snapshot: { mode: 'coop', status: 'playing' } }, 'competitive'), false);
  assert.equal(canReuseActiveRoom({ closedByUser: false, snapshot: { mode: 'coop', status: 'finished' } }, 'coop'), false);
  assert.equal(canReuseActiveRoom({ closedByUser: true, snapshot: { mode: 'coop', status: 'lobby' } }, 'coop'), false);
});

test('a URL invite only auto-resumes a room when its mode matches the selected mode', () => {
  assert.equal(canAutoResumeRoom({ mode: 'competitive', status: 'playing' }, 'competitive'), true);
  assert.equal(canAutoResumeRoom({ mode: 'competitive', status: 'playing' }, 'coop'), false);
  assert.equal(canAutoResumeRoom({ mode: 'coop', status: 'closed' }, 'coop'), false);
});

test('client refreshes changed room snapshots when a websocket event is missed', async () => {
  const client = new RoomClient({ code: 'ABC234', storage: null });
  client.snapshot = { code: 'ABC234', status: 'lobby', revision: 2 };
  const previousFetch = global.fetch;
  const previousWebSocket = global.WebSocket;
  let received;
  client.addEventListener('room', (event) => { received = event.detail; });
  global.fetch = async () => Response.json({ snapshot: { code: 'ABC234', status: 'playing', revision: 3, gameState: { phase: 'walk' } } });
  try {
    await client.refreshSnapshot();
    assert.equal(received.type, 'room.snapshot');
    assert.equal(received.snapshot.status, 'playing');
    assert.equal(client.snapshot.revision, 3);
  } finally { global.fetch = previousFetch; client.destroy(); }
});

test('older websocket snapshots cannot roll a co-op turn back to the dice phase', () => {
  const client = new RoomClient({ code: 'ABC234', storage: null });
  client.snapshot = { code: 'ABC234', status: 'playing', revision: 12, gameState: { mode: 'coop', phase: 'choose-difficulty' } };
  client.receive(JSON.stringify({ type: 'room.snapshot', snapshot: { code: 'ABC234', status: 'playing', revision: 11, gameState: { mode: 'coop', phase: 'walk' } } }));
  assert.equal(client.snapshot.revision, 12);
  assert.equal(client.snapshot.gameState.phase, 'choose-difficulty');
  client.destroy();
});

test('a rejected room action refreshes the authoritative snapshot before showing its error', async () => {
  const client = new RoomClient({ code: 'ABC234', storage: null });
  client.player = { playerId: 'active', resumeToken: 'token' };
  client.snapshot = { code: 'ABC234', status: 'playing', revision: 4, gameState: { mode: 'coop', phase: 'walk' } };
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    if (init.method === 'POST') return Response.json({ error: 'INVALID_GAME_PHASE', message: 'Não é possível rolar o dado agora.' }, { status: 400 });
    return Response.json({ snapshot: { code: 'ABC234', status: 'playing', revision: 5, gameState: { mode: 'coop', phase: 'choose-difficulty' } } });
  };
  try {
    await assert.rejects(client.command('game.roll'), /Não é possível rolar o dado agora/);
    assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET']);
    assert.equal(client.snapshot.revision, 5);
    assert.equal(client.snapshot.gameState.phase, 'choose-difficulty');
  } finally { global.fetch = previousFetch; client.destroy(); }
});

test('snapshot recovery follows a room code rotation when its websocket event was missed', async () => {
  const entries = new Map([['cyberrota-room-ABC234', JSON.stringify({ playerId: 'host', resumeToken: 'secret' })]]);
  const storage = { getItem: (key) => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) };
  const client = new RoomClient({ code: 'ABC234', storage });
  client.player = { playerId: 'host', resumeToken: 'secret' };
  client.snapshot = { code: 'ABC234', status: 'lobby', revision: 2 };
  const previousFetch = global.fetch;
  const previousWebSocket = global.WebSocket;
  global.WebSocket = undefined;
  const requested = [];
  global.fetch = async (url) => {
    requested.push(url);
    if (String(url).includes('/ABC234')) return Response.json({ error: 'ROOM_MOVED', message: 'Moved', newCode: 'DEF456' }, { status: 410 });
    return Response.json({ snapshot: { code: 'DEF456', status: 'lobby', revision: 3 } });
  };
  try {
    await client.refreshSnapshot();
    assert.deepEqual(requested, ['/api/rooms/ABC234', '/api/rooms/DEF456']);
    assert.equal(client.code, 'DEF456');
    assert.equal(client.snapshot.code, 'DEF456');
    assert.equal(entries.has('cyberrota-room-DEF456'), true);
  } finally { global.fetch = previousFetch; client.destroy(); global.WebSocket = previousWebSocket; }
});

test('rotating the room code preserves the player seat and migrates saved credentials', async () => {
  const entries = new Map([['cyberrota-room-ABC234', JSON.stringify({ playerId: 'host', resumeToken: 'secret' })]]);
  const storage = { getItem: (key) => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) };
  const client = new RoomClient({ code: 'ABC234', storage });
  client.player = { playerId: 'host', resumeToken: 'secret' };
  const previousFetch = global.fetch;
  const previousWebSocket = global.WebSocket;
  let requestedUrl;
  global.WebSocket = undefined;
  global.fetch = async (url) => {
    requestedUrl = url;
    return Response.json({ newCode: 'DEF456', snapshot: { code: 'DEF456', players: [{ playerId: 'host' }] } });
  };
  try {
    const result = await client.rotateCode();
    assert.match(requestedUrl, /\/api\/rooms\/ABC234\/rotate$/);
    assert.equal(result.snapshot.code, 'DEF456');
    assert.equal(client.code, 'DEF456');
    assert.equal(entries.has('cyberrota-room-ABC234'), false);
    assert.deepEqual(JSON.parse(entries.get('cyberrota-room-DEF456')), { playerId: 'host', resumeToken: 'secret' });
  } finally { global.fetch = previousFetch; client.destroy(); global.WebSocket = previousWebSocket; }
});
