import test from 'node:test';
import assert from 'node:assert/strict';
import roomClient from '../dist/room-client.js';
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
