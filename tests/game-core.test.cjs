const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../dist/game-core.js');
require('../dist/race-mode.js');

test('random option selection stays within the available choices', () => {
  assert.equal(Core.randomOptionIndex(4, () => 0), 0);
  assert.equal(Core.randomOptionIndex(4, () => 0.74), 2);
  assert.equal(Core.randomOptionIndex(4, () => 0.999), 3);
  assert.equal(Core.randomOptionIndex(0, () => 0.5), null);
});

test('multiplayer podium ranks weighted correct answers, then answer count, errors, and seat order', () => {
  const ranked = Core.rankPodium([
    { id: 'hard', name: 'Duda', seat: 0, correctByDifficulty: { easy: 0, medium: 0, hard: 1 }, correctAnswers: 1, wrongAnswers: 0 },
    { id: 'many', name: 'Bia', seat: 1, correctByDifficulty: { easy: 3, medium: 0, hard: 0 }, correctAnswers: 3, wrongAnswers: 1 },
    { id: 'few-errors', name: 'Caio', seat: 2, correctByDifficulty: { easy: 0, medium: 1, hard: 0 }, correctAnswers: 1, wrongAnswers: 1 },
    { id: 'seat-tie', name: 'Ana', seat: 3, correctByDifficulty: { easy: 0, medium: 1, hard: 0 }, correctAnswers: 1, wrongAnswers: 1 },
  ]);

  assert.deepEqual(ranked.map((player) => player.id), ['many', 'hard', 'few-errors']);
  assert.equal(ranked[0].points, 3);
  assert.deepEqual(ranked[0].correctByDifficulty, { easy: 3, medium: 0, hard: 0 });
  assert.equal(ranked[0].place, 1);
  assert.equal(ranked[2].place, 3);
});

test('multiplayer podium excludes bots and supports fewer than three real players', () => {
  const ranked = Core.rankPodium([
    { id: 'human', name: 'Ana', seat: 0, correctByDifficulty: { easy: 1, medium: 0, hard: 0 }, correctAnswers: 1, wrongAnswers: 0 },
    { id: 'bot', name: 'Bot 1', seat: 1, isBot: true, correctByDifficulty: { easy: 0, medium: 0, hard: 3 }, correctAnswers: 3, wrongAnswers: 0 },
  ]);

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].name, 'Ana');
});

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

test('a timed-out co-op turn advances the player and round without combat effects', () => {
  const initial = Core.newCoopState(['Ana', 'Bia'], { maxRounds: 4 });
  const timedOut = Core.skipCoopTurn(initial);
  assert.equal(timedOut.currentPlayer, 1);
  assert.equal(timedOut.round, 2);
  assert.equal(timedOut.log[0].outcome, 'timeout');
  assert.deepEqual(timedOut.servers, initial.servers);
  assert.equal(timedOut.alerts, 0);
  assert.equal(timedOut.hackerHp, initial.hackerHp);
  const finalTimeout = Core.skipCoopTurn({ ...timedOut, round: 4 });
  assert.equal(finalTimeout.outcome, 'loss');
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

test('3v3 server shutdown requires three players per team and starts at opposite stands', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  assert.deepEqual(state.teams.blue.positions, [0, 0, 0]);
  assert.deepEqual(state.teams.red.positions, [18, 18, 18]);
  assert.throws(() => Core.newRaceState(['A1'], ['V1', 'V2', 'V3']), /equipe/i);
});

test('3v3 turns alternate teams and rotate independently through each trio', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  assert.deepEqual(Core.racePairing(state), { team: 'blue', player: 'A1', playerIndex: 0 });
  const afterBlue = Core.resolveRaceTurn(state, { correct: true, roll: 4 });
  assert.deepEqual(Core.racePairing(afterBlue), { team: 'red', player: 'V1', playerIndex: 0 });
  assert.deepEqual(afterBlue.teams.blue.positions, [4, 0, 0]);
  assert.deepEqual(afterBlue.teams.red.positions, [18, 18, 18]);
  const afterRed = Core.resolveRaceTurn(afterBlue, { correct: true, roll: 2 });
  assert.deepEqual(Core.racePairing(afterRed), { team: 'blue', player: 'A2', playerIndex: 1 });
  assert.deepEqual(afterRed.teams.red.positions, [16, 18, 18]);
});

test('3v3 feedback can render a server snapshot whose active question was cleared', () => {
  const race = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  const afterTurn = Core.resolveRaceTurn(race, { correct: true, roll: 2 });
  const game = {
    mode: 'competitive', phase: 'race-feedback', race: afterTurn, raceLast: afterTurn.log[0], raceRoll: null,
    question: null, feedback: { card: { explanation: 'Resposta recebida e avaliada pelo servidor.' } },
    players: [...race.teams.blue.players, ...race.teams.red.players].map((name, index) => ({ name, color: ['#43d6ff', '#769bff', '#ffbd68', '#d49bff', '#72e0b3', '#ff8e9b'][index] })),
  };
  const ui = {
    playerColors: ['#43d6ff', '#769bff', '#ffbd68', '#d49bff', '#72e0b3', '#ff8e9b'],
    esc: (value) => String(value ?? ''),
    renderBoardPawnAvatar: () => '<svg></svg>',
    renderRaceDiceTray: () => '',
    renderBoardScene: () => '',
    uiIcon: () => '',
    soundMuted: false,
  };

  const rendered = globalThis.RaceMode.render(game, ui);
  assert.match(rendered, /Resposta recebida e avaliada pelo servidor\./);
});

test('a timed-out 3v3 turn only passes to the next player without moving either team', () => {
  const initial = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  const timedOut = Core.skipRaceTurn(initial);
  assert.equal(timedOut.turn, 1);
  assert.deepEqual(Core.racePairing(timedOut), { team: 'red', player: 'V1', playerIndex: 0 });
  assert.deepEqual(timedOut.teams, initial.teams);
  assert.equal(timedOut.log[0].skipped, true);
  const atLimit = Core.skipRaceTurn({ ...timedOut, turn: 59 });
  assert.equal(atLimit.outcome, 'draw');
});

test('a wrong 3v3 answer retreats the active pawn and advances the corresponding opponent by the die', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  state.teams.blue.positions[0] = 3;
  const next = Core.resolveRaceTurn(state, { correct: false, roll: 4 });
  assert.deepEqual(next.teams.blue.positions, [2, 0, 0]);
  assert.deepEqual(next.teams.red.positions, [14, 18, 18]);
  assert.equal(next.log[0].player, 'A1');
  assert.equal(next.log[0].advancedOpponent, 'V1');
  assert.equal(next.log[0].playerPosition, 2);
  assert.equal(next.log[0].opponentPosition, 14);
  assert.equal(state.teams.red.positions[0], 18, 'input state remains unchanged');
});

test('the opposing server stays on until all three members reach its stand', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  state.teams.blue.positions = [18, 18, 17];
  state.turn = 4;
  const win = Core.resolveRaceTurn(state, { correct: true, roll: 1 });
  assert.equal(win.outcome, 'blue-win');
  assert.equal(win.log[0].serverOff, 'red');
  const stillOn = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  stillOn.teams.blue.positions = [18, 0, 0];
  stillOn.turn = 2;
  const onePlayerAtStand = Core.resolveRaceTurn(stillOn, { correct: true, roll: 2 });
  assert.equal(onePlayerAtStand.outcome, null);
  assert.equal(onePlayerAtStand.log[0].serverOff, null);
  const miss = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  miss.teams.blue.positions = [17, 0, 0];
  miss.turn = 1;
  const opponentAdvanced = Core.resolveRaceTurn(miss, { correct: false, roll: 1 });
  assert.equal(opponentAdvanced.teams.blue.positions[0], 18);
  assert.equal(opponentAdvanced.outcome, null, 'a miss-driven advance still needs the whole trio at the stand');
});

test('3v3 movement clamps at each stand and a 60-turn limit without a full trio is a draw', () => {
  const state = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  state.teams.blue.positions[0] = 17;
  const atBase = Core.resolveRaceTurn(state, { correct: true, roll: 6 });
  assert.equal(atBase.teams.blue.positions[0], 18);
  assert.equal(atBase.outcome, null, 'one player cannot switch off the rival server alone');
  assert.equal(Core.resolveRaceTurn(atBase, { correct: true, roll: 6 }).turn, atBase.turn + 1, 'the match continues while two teammates are still on the route');
  const capped = Core.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']);
  capped.turn = 59;
  capped.teams.blue.positions[0] = 10;
  capped.teams.red.positions[0] = 10;
  const result = Core.resolveRaceTurn(capped, { correct: true, roll: 1 });
  assert.equal(result.outcome, 'draw');
  assert.equal(result.turn, 60);
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

test('co-op victory pauses for the slow-motion fall and reveals the menu three seconds later', () => {
  const start = 10000;
  assert.deepEqual(Core.coopVictoryStage(start, start), { stage: 'explosion', nextAt: start + 4200 });
  assert.deepEqual(Core.coopVictoryStage(start, start + 4199), { stage: 'explosion', nextAt: start + 4200 });
  assert.deepEqual(Core.coopVictoryStage(start, start + 4200), { stage: 'message', nextAt: start + 7200 });
  assert.deepEqual(Core.coopVictoryStage(start, start + 7199), { stage: 'message', nextAt: start + 7200 });
  assert.deepEqual(Core.coopVictoryStage(start, start + 7200), { stage: 'button', nextAt: null });
});
