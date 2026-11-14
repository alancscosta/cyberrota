import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYER_COLORS,
  createRoomState,
  generateRoomCode,
  joinRoom,
  chooseIdentity,
  startRoom,
  applyGameCommand,
  reconnectRoom,
  publicRoomSnapshot,
  nextMatch,
  closeRoom,
  transferHostForDeletedAccount,
  botCorrectness,
} from '../worker/src/rooms.mjs';

const host = { playerId: 'host-1', resumeToken: 'host-secret', name: 'Ana', colorIndex: 0 };
const deck = [{ id: 'card-1', theme: 'rede', chapter: 'Endereçamento', difficulty: 2, type: 'mcq', question: 'Qual opção está correta?', options: ['Correta', 'Incorreta'], answer: 0 }];

test('creates a cooperative room with six seats by default and a playable host identity', () => {
  const room = createRoomState({ code: 'ABC234', mode: 'coop', host });
  assert.equal(room.capacity, 6);
  assert.equal(room.players.length, 1);
  assert.equal(room.hostPlayerId, 'host-1');
  assert.equal(room.players[0].colorIndex, 0);
});

test('validates code, mode, capacity, player name, and available color', () => {
  assert.throws(() => createRoomState({ code: 'bad', mode: 'coop', host }), (error) => error.code === 'INVALID_CODE');
  assert.throws(() => createRoomState({ code: 'AB1234', mode: 'coop', host }), (error) => error.code === 'INVALID_CODE');
  assert.throws(() => createRoomState({ code: 'ABCD23', mode: 'coop', host }), (error) => error.code === 'INVALID_CODE');
  assert.throws(() => createRoomState({ code: 'ABC12', mode: 'coop', host }), (error) => error.code === 'INVALID_CODE');
  assert.throws(() => createRoomState({ code: 'ABC234', mode: 'solo', host }), (error) => error.code === 'INVALID_MODE');
  assert.throws(() => createRoomState({ code: 'ABC234', mode: 'coop', capacity: 1, host }), (error) => error.code === 'INVALID_CAPACITY');
  assert.throws(() => createRoomState({ code: 'ABC234', mode: 'coop', host: { ...host, name: ' ' } }), (error) => error.code === 'INVALID_NAME');
  assert.equal(PLAYER_COLORS.length, 6);
});

test('generates a six character room code with exactly three letters and three digits', () => {
  const code = generateRoomCode({ getRandomValues(bytes) { bytes.fill(0); return bytes; } });
  assert.match(code, /^(?=(?:[^A-Z]*[A-Z]){3}[^A-Z]*$)(?=(?:[^2-9]*[2-9]){3}[^2-9]*$)[A-HJ-NP-Z2-9]{6}$/);
});

test('joining reserves unique colors and auto-balances competitive teams', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'competitive', host });
  const first = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 });
  room = first.room;
  assert.equal(first.player.team, 'red');
  const second = joinRoom(room, { playerId: 'p3', resumeToken: 'p3-secret', name: 'Caio', colorIndex: 2 });
  assert.equal(second.player.team, 'blue');
  assert.throws(() => joinRoom(second.room, { playerId: 'p4', resumeToken: 'p4-secret', name: 'Dani', colorIndex: 2 }), (error) => error.code === 'COLOR_TAKEN');
});

test('identity updates cannot steal a color reserved by another player', () => {
  const room = createRoomState({ code: 'ABC234', mode: 'coop', host });
  const { room: joined } = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 });
  assert.throws(() => chooseIdentity(joined, 'host-1', { name: 'Ana', colorIndex: 1 }), (error) => error.code === 'COLOR_TAKEN');
});

test('only the host can start; an underfilled lobby requires explicit confirmation', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', capacity: 4, host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  assert.throws(() => startRoom(room, 'p2', { confirmEarly: true }), (error) => error.code === 'HOST_ONLY');
  assert.throws(() => startRoom(room, 'host-1', { confirmEarly: false }), (error) => error.code === 'ROOM_NOT_FULL' && error.requiresConfirmation === true);
  const started = startRoom(room, 'host-1', { confirmEarly: true, config: { deck } });
  assert.equal(started.status, 'playing');
  assert.equal(started.players.length, 2);
});

test('cooperative room requires two real players before start', () => {
  const room = createRoomState({ code: 'ABC234', mode: 'coop', host });
  assert.throws(() => startRoom(room, 'host-1', { confirmEarly: true }), (error) => error.code === 'ROOM_MIN_PLAYERS');
});

test('competitive early start fills six seats with exactly three players per team', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'competitive', host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = joinRoom(room, { playerId: 'p3', resumeToken: 'p3-secret', name: 'Caio', colorIndex: 2 }).room;
  const started = startRoom(room, 'host-1', { confirmEarly: true, config: { deck }, random: () => 0.5 });
  assert.equal(started.players.length, 6);
  assert.equal(started.players.filter((player) => player.team === 'blue').length, 3);
  assert.equal(started.players.filter((player) => player.team === 'red').length, 3);
  assert.equal(started.players.filter((player) => player.isBot).length, 3);
  assert.equal(started.players.filter((player) => player.isBot).every((player) => player.colorIndex >= 0), true);
  assert.equal(botCorrectness(() => 0.49), true);
  assert.equal(botCorrectness(() => 0.5), false);
});

test('reconnect restores the reserved player and public snapshots omit resume tokens', () => {
  const room = createRoomState({ code: 'ABC234', mode: 'coop', host });
  const result = reconnectRoom(room, 'host-secret');
  assert.equal(result.player.playerId, 'host-1');
  assert.equal(publicRoomSnapshot(result.room).players[0].resumeToken, undefined);
});

test('next match returns to the same lobby and close ends room access', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = startRoom(room, 'host-1', { confirmEarly: true, config: { deck } });
  room.status = 'finished';
  room = nextMatch(room, 'host-1');
  assert.equal(room.code, 'ABC234');
  assert.equal(room.status, 'lobby');
  assert.deepEqual(room.players.map((player) => player.playerId), ['host-1', 'p2']);
  assert.equal(closeRoom(room, 'host-1').status, 'closed');
});

test('the server controls turn order, rolls, question selection, answer validation, and cooperative scoring', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', capacity: 2, host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = startRoom(room, 'host-1', { config: { deck }, random: () => 0 });
  assert.throws(() => applyGameCommand(room, 'p2', 'game.roll'), (error) => error.code === 'NOT_ACTIVE_PLAYER');
  room = applyGameCommand(room, 'host-1', 'game.roll', {}, { random: () => 0 });
  assert.equal(room.gameState.coopRoll, 1);
  assert.equal(room.gameState.phase, 'choose-difficulty');
  room = applyGameCommand(room, 'host-1', 'game.choose-difficulty', { difficulty: 2 }, { random: () => 0 });
  assert.equal(room.gameState.question.id, 'card-1');
  room = applyGameCommand(room, 'host-1', 'game.answer', { answer: 0 }, { random: () => 0 });
  assert.equal(room.gameState.feedback.correct, true);
  assert.equal(room.gameState.players[0].correctAnswers, 1);
  assert.equal(room.gameState.players[0].correctByDifficulty.medium, 1);
  assert.equal(room.gameState.coop.position, 1);
  assert.equal(room.gameState.currentPlayerId, 'p2');
  const snapshot = publicRoomSnapshot(room);
  assert.equal(snapshot.gameState.question, null);
  assert.equal(snapshot.config.deck, undefined);
  assert.equal(snapshot.players.some((player) => player.accountId !== undefined), false);
  assert.equal(JSON.stringify(snapshot).includes('resumeToken'), false);
});

test('online turn deadlines include the original 5 second callout and 20 second action window', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', capacity: 2, host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = startRoom(room, 'host-1', { config: { deck }, random: () => 0, now: 1_000 });
  assert.equal(room.gameState.turnDeadlineAt, 26_000);
  room = applyGameCommand(room, 'host-1', 'game.roll', {}, { random: () => 0, now: 6_000 });
  assert.equal(room.gameState.turnDeadlineAt, 31_000);
  room = applyGameCommand(room, 'host-1', 'game.choose-difficulty', { difficulty: 2 }, { random: () => 0, now: 11_000 });
  assert.equal(room.gameState.turnDeadlineAt, 36_000);
});

test('the server controls race roll/answer and advances to the paired participant', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'competitive', host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = startRoom(room, 'host-1', { confirmEarly: true, config: { deck }, random: () => 0 });
  assert.equal(room.gameState.currentPlayerId, 'host-1');
  room = applyGameCommand(room, 'host-1', 'game.roll', {}, { random: () => 0 });
  assert.equal(room.gameState.raceRoll, 1);
  room = applyGameCommand(room, 'host-1', 'game.answer', { answer: 0 });
  assert.equal(room.gameState.race.teams.blue.positions[0], 1);
  assert.equal(room.gameState.players[0].correctAnswers, 1);
  room = applyGameCommand(room, 'host-1', 'game.continue');
  assert.equal(room.gameState.currentPlayerId, 'p2');
  assert.equal(room.gameState.phase, 'race-roll');
});

test('account deletion anonymizes linked seats and transfers host without removing game seats', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', host: { ...host, accountId: 'account-a' } });
  room = joinRoom(room, { playerId: 'p2', accountId: 'account-b', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  const result = transferHostForDeletedAccount(room, 'account-a');
  assert.equal(result.newHostId, 'p2');
  assert.equal(result.room.players.length, 2);
  assert.equal(result.room.players[0].accountId, null);
  assert.equal(result.room.players[0].name, 'Jogador');
});

test('server timeout skips the current turn without recording an incorrect answer', () => {
  let room = createRoomState({ code: 'ABC234', mode: 'coop', capacity: 2, host });
  room = joinRoom(room, { playerId: 'p2', resumeToken: 'p2-secret', name: 'Bia', colorIndex: 1 }).room;
  room = startRoom(room, 'host-1', { config: { deck } });
  room = applyGameCommand(room, 'host-1', 'game.roll');
  room = applyGameCommand(room, 'host-1', 'game.choose-difficulty', { difficulty: 2 });
  const timedOut = applyGameCommand(room, 'host-1', 'game.skip');
  assert.equal(timedOut.gameState.players[0].wrongAnswers, 0);
  assert.equal(timedOut.gameState.currentPlayerId, 'p2');
  assert.equal(timedOut.gameState.phase, 'walk');
});
