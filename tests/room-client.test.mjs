import test from 'node:test';
import assert from 'node:assert/strict';
import * as roomClient from '../dist/room-client.js';
const { RoomClient, availableRoomColors, needsEarlyStartConfirmation, roomShareUrl } = roomClient;

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
