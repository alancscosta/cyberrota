import test from 'node:test';
import assert from 'node:assert/strict';
import roomClient from '../dist/room-client.js';
const { availableRoomColors, needsEarlyStartConfirmation, roomShareUrl } = roomClient;

test('lobby color options hide characters selected by other people', () => {
  const room = { players: [{ playerId: 'a', colorIndex: 0 }, { playerId: 'b', colorIndex: 1 }] };
  assert.deepEqual(availableRoomColors(room, 'a').map((color) => color.index), [0, 2, 3, 4, 5]);
});

test('lobby asks confirmation while seats remain and not after filling capacity', () => {
  assert.equal(needsEarlyStartConfirmation({ capacity: 6, players: [{ isBot: false }, { isBot: false }] }), true);
  assert.equal(needsEarlyStartConfirmation({ capacity: 2, players: [{ isBot: false }, { isBot: false }] }), false);
});

test('share link carries the room code in the URL while preserving existing parameters', () => {
  assert.equal(roomShareUrl('abcd2345', 'https://game.example/?from=friend'), 'https://game.example/?from=friend&sala=ABCD2345');
});
