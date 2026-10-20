const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../dist/game-core.js');

test('route movement stops at the next unearned checkpoint', () => {
  assert.equal(Core.advanceOnRoute(1, 3, [3, 6, 9, 12, 15], 18), 3);
  assert.equal(Core.advanceOnRoute(3, 3, [6, 9, 12, 15], 18), 6);
});

test('difficulty cards are selected without leaking another theme', () => {
  const deck = [
    { id: 'a', theme: 'rede', difficulty: 1 },
    { id: 'b', theme: 'rede', difficulty: 2 },
    { id: 'c', theme: 'seguranca', difficulty: 2 },
  ];
  const card = Core.pickCard(deck, { theme: 'rede', difficulty: 2, random: () => 0 });
  assert.equal(card.id, 'b');
});

test('answer checking handles text and ordering answers', () => {
  assert.equal(Core.checkAnswer({ type: 'fill', answer: 'transmissao' }, 'Transmissão'), true);
  assert.equal(Core.checkAnswer({ type: 'order', answer: ['SYN', 'SYN-ACK', 'ACK'] }, ['SYN', 'SYN-ACK', 'ACK']), true);
  assert.equal(Core.checkAnswer({ type: 'order', answer: ['SYN', 'SYN-ACK', 'ACK'] }, ['ACK', 'SYN', 'SYN-ACK']), false);
});

test('co-op correct answer heals server and scales hacker damage by difficulty', () => {
  const state = Core.newCoopState(['Ana'], { maxRounds: 12, hackerHp: 20 });
  const next = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 3 });
  assert.equal(next.hackerHp, 16);
  assert.equal(next.servers.rede, 100);
  assert.equal(next.round, 2);
  assert.equal(state.hackerHp, 20, 'input state remains unchanged');
});

test('three alerts damage the weakest active server and three downed servers lose', () => {
  const state = Core.newCoopState(['Ana'], { maxRounds: 12, hackerHp: 20 });
  state.servers.rede = 25;
  state.alerts = 2;
  const next = Core.resolveCoopTurn(state, { theme: 'transporte', correct: false, difficulty: 1 });
  assert.equal(next.alerts, 0);
  assert.equal(next.servers.rede, 0);
  state.servers.rede = 0;
  state.servers.fisica = 0;
  state.servers.transporte = 25;
  const final = Core.resolveCoopTurn(state, { theme: 'transporte', correct: false, difficulty: 1 });
  assert.equal(final.outcome, 'loss');
});

test('editing custom decks does not mutate the source deck', () => {
  const base = [{ id: 'default', question: 'q' }];
  const snapshot = Core.snapshotDeck(base);
  snapshot[0].question = 'edited';
  assert.equal(base[0].question, 'q');
});

test('competitive winner requires all five seals and the destination', () => {
  const players = [
    { name: 'Ana', score: 10, seals: ['fisica', 'rede', 'transporte', 'aplicacao', 'seguranca'], position: Core.DESTINATION },
    { name: 'Bia', score: 14, seals: ['fisica', 'rede', 'transporte', 'aplicacao'], position: Core.DESTINATION },
    { name: 'Caio', score: 14, seals: ['fisica', 'rede', 'transporte', 'aplicacao', 'seguranca'], position: Core.DESTINATION },
  ];
  const result = Core.winner(players);
  assert.equal(result.name, 'Caio');
});

test('competitive ties share the win between qualified players with the top score', () => {
  const seals = ['fisica', 'rede', 'transporte', 'aplicacao', 'seguranca'];
  const players = [
    { name: 'Ana', score: 12, seals, position: Core.DESTINATION },
    { name: 'Bia', score: 12, seals, position: Core.DESTINATION },
    { name: 'Caio', score: 8, seals, position: Core.DESTINATION },
  ];
  const result = Core.winner(players);
  assert.deepEqual(result.tie.map((player) => player.name), ['Ana', 'Bia']);
});
