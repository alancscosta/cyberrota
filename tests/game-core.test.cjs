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

test('co-op team pawn advances one route space on a correct answer and stays put on a miss', () => {
  const initial = Core.newCoopState(['Ana', 'Bia']);
  const correct = Core.resolveCoopTurn(initial, { theme: 'rede', correct: true, difficulty: 1 });
  assert.equal(correct.position, 1);
  assert.equal(initial.position, 0);

  const missed = Core.resolveCoopTurn(initial, { theme: 'rede', correct: false, difficulty: 1 });
  assert.equal(missed.position, 0);
});

test('co-op uses the rolled die to move the shared pawn along the full route', () => {
  const initial = Core.newCoopState(['Ana', 'Bia', 'Caio']);
  const moved = Core.resolveCoopTurn(initial, { theme: 'rede', correct: true, difficulty: 1, roll: 3 });
  assert.equal(moved.position, 3);
  assert.equal(moved.currentPlayer, 1);
  assert.equal(initial.position, 0);

  const missed = Core.resolveCoopTurn(initial, { theme: 'rede', correct: false, difficulty: 1, roll: 3 });
  assert.equal(missed.position, 0, 'an incorrect answer never moves the pawn, whatever the roll');
});

test('co-op preserves each selected short, standard, or challenge round limit', () => {
  for (const maxRounds of [20, 24, 27]) {
    let state = Core.newCoopState(['Ana'], { maxRounds, hackerHp: 5000 });
    for (let turn = 0; turn < maxRounds - 1; turn += 1) {
      state = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 1, roll: 1 });
      assert.equal(state.outcome, null, `the ${maxRounds}-round match remains active before its final turn`);
    }
    assert.equal(state.round, maxRounds);
    state = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 1, roll: 1 });
    assert.equal(state.outcome, 'loss', `the ${maxRounds}-round match ends on its chosen limit`);
  }
});

test('co-op requires reaching the external signal before the Hacker can be defeated', () => {
  const early = Core.newCoopState(['Ana'], { hackerHp: 2 });
  const staggered = Core.resolveCoopTurn(early, { theme: 'rede', correct: true, difficulty: 1, roll: 1 });
  assert.equal(staggered.position, 1);
  assert.equal(staggered.hackerHp, 1);
  assert.equal(staggered.outcome, null);

  const atFinish = { ...early, position: Core.DESTINATION, hackerHp: 2 };
  const finalHit = Core.resolveCoopTurn(atFinish, { theme: 'rede', correct: true, difficulty: 1, roll: 2 });
  assert.equal(finalHit.position, Core.DESTINATION);
  assert.equal(finalHit.hackerHp, 0);
  assert.equal(finalHit.outcome, 'win');
});

test('co-op rotates turns through every participant in a six-player room', () => {
  let state = Core.newCoopState(['Ana', 'Bia', 'Caio', 'Duda', 'Eli', 'Fê']);
  const seen = [];
  for (let i = 0; i < 6; i += 1) {
    seen.push(state.players[state.currentPlayer].name);
    state = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 1, roll: 1 });
  }
  assert.deepEqual(seen, ['Ana', 'Bia', 'Caio', 'Duda', 'Eli', 'Fê']);
  assert.equal(state.currentPlayer, 0);
});

test('co-op preserves one complete turn for every room size from one to six', () => {
  for (let count = 1; count <= 6; count += 1) {
    const players = Array.from({ length: count }, (_, index) => `Jogador ${index + 1}`);
    let state = Core.newCoopState(players);
    const firstRound = [];
    for (let turn = 0; turn < count; turn += 1) {
      firstRound.push(state.players[state.currentPlayer].name);
      state = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 1, roll: 1 });
    }
    assert.deepEqual(firstRound, players, `all ${count} players should act in setup order`);
    assert.equal(state.currentPlayer, 0, `room of ${count} should return to its first player`);
    assert.equal(state.round, count + 1);
  }
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

test('3v3 race requires three named players on each team and starts with equal health', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  assert.equal(state.teams.blue.hp, 10);
  assert.equal(state.teams.red.hp, 10);
  assert.throws(() => Core.newRaceState(['A1'], ['V1', 'V2', 'V3']), /equipe/i);
});

test('3v3 duels rotate through each roster and alternate who answers first', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  assert.deepEqual(Core.racePairing(state), { blue: 'A1', red: 'V1', first: 'blue' });
  const next = Core.resolveRaceDuel(state, { blueCorrect: true, redCorrect: true });
  assert.deepEqual(Core.racePairing(next), { blue: 'A2', red: 'V2', first: 'red' });
  assert.equal(next.teams.blue.hp, 10);
  assert.equal(next.teams.red.hp, 10);
  assert.equal(next.teams.blue.position, 1);
  assert.equal(next.teams.red.position, 1);
});

test('3v3 race damages only the team that misses a different-result duel', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  const next = Core.resolveRaceDuel(state, { blueCorrect: true, redCorrect: false });
  assert.equal(next.teams.red.hp, 9);
  assert.equal(next.teams.blue.hp, 10);
  assert.equal(state.teams.red.hp, 10, 'input state remains unchanged');
});

test('3v3 race awards seals while teams advance along the route', () => {
  let match = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  for (let step = 0; step < 3; step += 1) match = Core.resolveRaceDuel(match, { blueCorrect: true, redCorrect: false });
  assert.equal(match.teams.blue.position, 3);
  assert.deepEqual(match.teams.blue.seals, ['fisica']);
  assert.equal(match.teams.red.position, 0);
});

test('3v3 race ends on zero health before the finish or when a team completes the route', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  state.teams.red.hp = 1;
  const defeated = Core.resolveRaceDuel(state, { blueCorrect: true, redCorrect: false });
  assert.equal(defeated.outcome, 'blue-win');
  assert.equal(defeated.teams.blue.position, 1);
  assert.equal(defeated.teams.red.position, 0);
  const final = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  final.teams.blue.position = Core.DESTINATION - 1;
  final.teams.blue.seals = ['fisica', 'rede', 'transporte', 'aplicacao', 'seguranca'];
  const finished = Core.resolveRaceDuel(final, { blueCorrect: true, redCorrect: false });
  assert.equal(finished.outcome, 'blue-win');
  assert.equal(finished.teams.blue.position, Core.DESTINATION);
  let match = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  for (let duel = 0; duel < Core.DESTINATION; duel += 1) {
    match = Core.resolveRaceDuel(match, { blueCorrect: true, redCorrect: true });
  }
  assert.equal(match.outcome, 'draw');
  assert.equal(match.duel, Core.DESTINATION);
});

test('challenge mode makes the hacker recover and inflict extra server damage on a miss', () => {
  const state = Core.newCoopState(['Ana'], { maxRounds: 12, hackerHp: 20, difficultyMode: 'challenge' });
  state.hackerHp = 16;
  const next = Core.resolveCoopTurn(state, { theme: 'rede', correct: false, difficulty: 2 });
  assert.equal(next.hackerHp, 18);
  assert.equal(next.servers.rede, 50);
  assert.equal(next.log[0].hackerHealed, 2);
});

test('a real Hacker hit drops one armor stage and a Challenge heal restores one stage', () => {
  const state = Core.newCoopState(['Ana'], { maxRounds: 12, hackerHp: 20, difficultyMode: 'challenge' });
  const damaged = Core.resolveCoopTurn(state, { theme: 'rede', correct: true, difficulty: 3, roll: 1 });
  assert.equal(damaged.hackerHp, 16);
  assert.equal(damaged.armorStage, 1);
  const repaired = Core.resolveCoopTurn(damaged, { theme: 'rede', correct: false, difficulty: 1 });
  assert.equal(repaired.hackerHp, 18);
  assert.equal(repaired.armorStage, 0);
  assert.equal(damaged.armorStage, 1, 'repair leaves the prior state untouched');
});

test('co-op healing nodes restore the weakest server once and never exceed 100%', () => {
  const state = Core.newCoopState(['Ana'], { maxRounds: 12, hackerHp: 20 });
  state.servers.rede = 25;
  state.servers.fisica = 50;
  assert.equal(Core.useCoopHealingNode(state, 0), state, 'a node can only be used from its route space');
  state.position = Core.HEALING_SPACES[1];
  assert.equal(Core.useCoopHealingNode(state, 0), state, 'the team must be at the matching route space');
  state.position = Core.HEALING_SPACES[0];
  const healed = Core.useCoopHealingNode(state, 0);
  assert.equal(healed.servers.rede, 50);
  assert.equal(healed.healingNodes[0].used, true);
  assert.equal(Core.useCoopHealingNode(healed, 0), healed, 'used node cannot be reused');
  const full = Core.newCoopState(['Ana']);
  assert.equal(Core.useCoopHealingNode(full, 0), full, 'cannot waste a node when every server is intact');
});

test('hacker visual phase follows health thresholds', () => {
  assert.equal(Core.hackerPhase(20, 20), 'armored');
  assert.equal(Core.hackerPhase(15, 20), 'damaged');
  assert.equal(Core.hackerPhase(10, 20), 'broken');
  assert.equal(Core.hackerPhase(5, 20), 'critical');
});
