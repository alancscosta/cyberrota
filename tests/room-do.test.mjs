import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomDurableObject } from '../worker/src/rooms.mjs';

class MemoryStorage {
  values = new Map();
  alarmAt = null;
  async get(key) { return this.values.get(key); }
  async put(key, value) { this.values.set(key, structuredClone(value)); }
  async setAlarm(at) { this.alarmAt = at; }
  async deleteAlarm() { this.alarmAt = null; }
}

class MemoryState {
  storage = new MemoryStorage();
  sockets = [];
  getWebSockets() { return this.sockets; }
}

async function send(doInstance, path, { method = 'GET', body } = {}) {
  const request = new Request(`https://room.test${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const response = await doInstance.fetch(request);
  return { status: response.status, body: await response.json() };
}

const deck = [{ id: 'one', theme: 'rede', chapter: 'IP', difficulty: 2, type: 'mcq', question: 'Qual?', options: ['A', 'B'], answer: 0 }];

test('Durable Object initializes, joins, stores the game server-side, and filters secrets from snapshots', async () => {
  const state = new MemoryState();
  const room = new RoomDurableObject(state, {});
  const created = await send(room, '/initialize', { method: 'POST', body: {
    code: 'ABC234', mode: 'coop', capacity: 2, host: { playerId: 'host', accountId: 'acct-host', resumeToken: 'host-secret', name: 'Ana', colorIndex: 0 },
  } });
  assert.equal(created.status, 200);
  assert.equal(created.body.player.resumeToken, 'host-secret');
  assert.deepEqual(created.body.accountRooms, [{ accountId: 'acct-host', roomCode: 'ABC234', playerId: 'host', isHost: true }]);
  assert.equal(state.storage.alarmAt !== null, true);
  await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'room.configure', payload: { config: { deck } } } });
  const joined = await send(room, '/join', { method: 'POST', body: { name: 'Bia', colorIndex: 1, accountId: 'acct-bia' } });
  assert.equal(joined.status, 200);
  assert.equal(joined.body.accountRooms.length, 2);
  await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'room.start' } });
  await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'game.roll' } });
  await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'game.choose-difficulty', payload: { difficulty: 2 } } });
  const publicState = await send(room, '/snapshot');
  assert.equal(publicState.body.snapshot.gameState.question.answer, undefined);
  assert.equal(JSON.stringify(publicState.body.snapshot).includes('resumeToken'), false);
  assert.equal(JSON.stringify(publicState.body.snapshot).includes('accountId'), false);
});

test('a turn is accepted only from the active participant and completion persists in the room', async () => {
  const state = new MemoryState();
  const room = new RoomDurableObject(state, {});
  await send(room, '/initialize', { method: 'POST', body: {
    code: 'ABC234', mode: 'coop', capacity: 2, config: { deck },
    host: { playerId: 'host', resumeToken: 'host-secret', name: 'Ana', colorIndex: 0 },
  } });
  const joined = await send(room, '/join', { method: 'POST', body: { name: 'Bia', colorIndex: 1 } });
  await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'room.start' } });
  const rejected = await send(room, '/command', { method: 'POST', body: { resumeToken: joined.body.player.resumeToken, action: 'game.roll' } });
  assert.equal(rejected.status, 400);
  assert.equal(rejected.body.error, 'NOT_ACTIVE_PLAYER');
  const accepted = await send(room, '/command', { method: 'POST', body: { resumeToken: 'host-secret', action: 'game.roll' } });
  assert.equal(accepted.body.snapshot.gameState.phase, 'choose-difficulty');
});

test('room ownership can be transferred when an account is deleted', async () => {
  const room = new RoomDurableObject(new MemoryState(), {});
  await send(room, '/initialize', { method: 'POST', body: {
    code: 'ABC234', mode: 'coop', capacity: 2,
    host: { playerId: 'host', accountId: 'account-a', resumeToken: 'host-secret', name: 'Ana', colorIndex: 0 },
  } });
  const joined = await send(room, '/join', { method: 'POST', body: { name: 'Bia', colorIndex: 1, accountId: 'account-b' } });
  const result = await room.transferHostForDeletedAccount('account-a');
  assert.equal(result.newHostId, joined.body.player.playerId);
  assert.equal(result.snapshot.players.length, 2);
  assert.equal(result.snapshot.players[0].name, 'Jogador');
  assert.deepEqual(result.accountRooms, [{ accountId: 'account-b', roomCode: 'ABC234', playerId: joined.body.player.playerId, isHost: true }]);
});
