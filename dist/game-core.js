(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GameCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const THEMES = [
    { id: 'fisica', name: 'Física & Enlace', short: 'Física', color: '#70d6c0' },
    { id: 'rede', name: 'Rede', short: 'Rede', color: '#7ca9ff' },
    { id: 'transporte', name: 'Transporte', short: 'Transporte', color: '#f3bd70' },
    { id: 'aplicacao', name: 'Aplicação', short: 'Aplicação', color: '#d39bea' },
    { id: 'seguranca', name: 'Segurança', short: 'Segurança', color: '#fb7e78' },
  ];
  const CHECKPOINTS = [3, 6, 9, 12, 15];
  const DESTINATION = 18;
  const HEALING_SPACES = [2, 10, 14];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function advanceOnRoute(position, roll, checkpoints = CHECKPOINTS, destination = DESTINATION) {
    const raw = Math.min(destination, position + Math.max(1, Math.floor(roll)));
    const nextCheckpoint = checkpoints.find((checkpoint) => checkpoint > position);
    return nextCheckpoint !== undefined && raw >= nextCheckpoint ? nextCheckpoint : raw;
  }

  function pickCard(deck, options = {}) {
    const { theme, difficulty, chapter = 'all', avoidIds = [], random = Math.random } = options;
    const filtered = deck.filter((card) =>
      (!theme || card.theme === theme) &&
      (!difficulty || card.difficulty === difficulty) &&
      (chapter === 'all' || card.chapter === chapter),
    );
    if (!filtered.length) return null;
    const fresh = filtered.filter((card) => !avoidIds.includes(card.id));
    const pool = fresh.length ? fresh : filtered;
    return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  }

  function normalizeText(text) {
    return String(text ?? '').toLocaleLowerCase('pt-BR').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function checkAnswer(card, userAnswer) {
    if (!card) return false;
    if (card.type === 'order') {
      const expected = card.answer.map(normalizeText);
      const submitted = (Array.isArray(userAnswer) ? userAnswer : []).map(normalizeText);
      return expected.length === submitted.length && expected.every((part, index) => part === submitted[index]);
    }
    if (card.type === 'fill' || card.type === 'subnet') {
      const accepted = [card.answer, ...(card.acceptedAnswers || [])].map(normalizeText);
      return accepted.includes(normalizeText(userAnswer));
    }
    if (card.type === 'truefalse' || card.type === 'boolean') return String(userAnswer) === String(card.answer);
    if (card.type === 'matching') {
      const expected = JSON.stringify(card.answer);
      return JSON.stringify(userAnswer) === expected;
    }
    return Number(userAnswer) === Number(card.answer);
  }

  function newCoopState(players = ['Jogador 1'], options = {}) {
    const names = players.length ? players : ['Jogador 1'];
    return {
      players: names.map((name) => ({ name, usedRoles: [] })),
      currentPlayer: 0,
      position: 0,
      round: 1,
      maxRounds: options.maxRounds || 24,
      hackerHp: options.hackerHp || 20,
      startingHp: options.hackerHp || 20,
      armorStage: 0,
      difficultyMode: options.difficultyMode || 'normal',
      servers: Object.fromEntries(THEMES.map(({ id }) => [id, 100])),
      healingNodes: [0, 1, 2].map((id) => ({ id, used: false })),
      alerts: 0,
      outcome: null,
      bossStaggered: false,
      log: [],
    };
  }

  function resolveCoopTurn(state, result) {
    if (state.outcome) return state;
    const next = clone(state);
    const theme = THEMES.some((item) => item.id === result.theme) ? result.theme : THEMES[0].id;
    const difficulty = Math.max(1, Math.min(3, Number(result.difficulty) || 1));
    if (result.correct) {
      next.servers[theme] = Math.min(100, next.servers[theme] + 25);
      const hackerHpBeforeHit = next.hackerHp;
      next.hackerHp = Math.max(0, next.hackerHp - difficulty - 1);
      if (next.hackerHp < hackerHpBeforeHit) next.armorStage = Math.min(5, (Number(next.armorStage) || 0) + 1);
      const roll = Math.max(1, Math.min(3, Math.floor(Number(result.roll) || 1)));
      next.position = Math.min(DESTINATION, (next.position || 0) + roll);
      next.log.unshift({ outcome: 'correct', theme, round: next.round, difficulty, roll, position: next.position });
      if (next.hackerHp === 0 && next.position < DESTINATION) {
        next.hackerHp = 1;
        next.bossStaggered = true;
      } else if (next.hackerHp === 0) {
        next.outcome = 'win';
      }
      if (next.position >= DESTINATION && next.hackerHp === 0) next.outcome = 'win';
    } else {
      const challenge = next.difficultyMode === 'challenge';
      const serverDamage = challenge ? 50 : 25;
      next.servers[theme] = Math.max(0, next.servers[theme] - serverDamage);
      if (challenge) {
        const hackerHpBeforeRepair = next.hackerHp;
        next.hackerHp = Math.min(next.startingHp, next.hackerHp + 2);
        if (next.hackerHp > hackerHpBeforeRepair) next.armorStage = Math.max(0, (Number(next.armorStage) || 0) - 1);
      }
      next.alerts += 1;
      next.log.unshift({ outcome: 'incorrect', theme, round: next.round, difficulty, serverDamage, hackerHealed: challenge ? 2 : 0 });
      if (next.alerts >= 3) {
        const active = THEMES.map(({ id }) => id).filter((id) => next.servers[id] > 0);
        if (active.length) {
          active.sort((a, b) => next.servers[a] - next.servers[b]);
          next.servers[active[0]] = Math.max(0, next.servers[active[0]] - 25);
        }
        next.alerts = 0;
      }
      if (Object.values(next.servers).filter((integrity) => integrity === 0).length >= 3) next.outcome = 'loss';
    }

    if (!next.outcome && next.round >= next.maxRounds) next.outcome = 'loss';
    if (!next.outcome) {
      next.round += 1;
      next.currentPlayer = (next.currentPlayer + 1) % next.players.length;
    }
    return next;
  }

  function skipCoopTurn(state) {
    if (!state || state.outcome) return state;
    const next = clone(state);
    next.log.unshift({ outcome: 'timeout', round: next.round, player: next.players[next.currentPlayer]?.name || null });
    if (next.round >= next.maxRounds) {
      next.outcome = 'loss';
      return next;
    }
    next.round += 1;
    next.currentPlayer = (next.currentPlayer + 1) % next.players.length;
    return next;
  }

  function useCoopHealingNode(state, nodeId) {
    if (!state || state.outcome || !Array.isArray(state.healingNodes)) return state;
    const index = state.healingNodes.findIndex((node) => node.id === Number(nodeId) && !node.used);
    if (index < 0 || state.position !== HEALING_SPACES[index]) return state;
    const target = THEMES.map(({ id }) => id).find((id) => state.servers[id] < 100);
    if (!target) return state;
    const next = clone(state);
    const weakest = THEMES.map(({ id }, order) => ({ id, order, health: next.servers[id] }))
      .filter((server) => server.health < 100)
      .sort((a, b) => a.health - b.health || a.order - b.order)[0];
    next.servers[weakest.id] = Math.min(100, next.servers[weakest.id] + 25);
    next.healingNodes[index].used = true;
    next.log.unshift({ outcome: 'healed', theme: weakest.id, amount: 25, nodeId: Number(nodeId), round: next.round });
    return next;
  }

  function newRaceState(bluePlayers, redPlayers, options = {}) {
    const normalizeTeam = (players) => Array.isArray(players) ? players.map((player) => String(player?.name ?? player).trim()) : [];
    const blue = normalizeTeam(bluePlayers);
    const red = normalizeTeam(redPlayers);
    if (blue.length !== 3 || red.length !== 3 || [...blue, ...red].some((name) => !name)) throw new RangeError('Desligue o Servidor exige três jogadores por equipe.');
    return {
      teams: {
        blue: { players: blue, positions: [0, 0, 0] },
        red: { players: red, positions: [DESTINATION, DESTINATION, DESTINATION] },
      },
      turn: 0,
      maxTurns: Math.max(2, Math.floor(Number(options.maxTurns) || 60)),
      outcome: null,
      log: [],
    };
  }

  function racePairing(state) {
    if (!state || state.outcome) return null;
    const team = state.turn % 2 === 0 ? 'blue' : 'red';
    const playerIndex = Math.floor(state.turn / 2) % 3;
    return { team, player: state.teams[team].players[playerIndex], playerIndex };
  }

  function resolveRaceTurn(state, result) {
    if (!state || state.outcome || state.turn >= state.maxTurns) return state;
    const { team, player, playerIndex } = racePairing(state);
    const next = clone(state);
    const opponent = team === 'blue' ? 'red' : 'blue';
    const opponentPlayer = next.teams[opponent].players[playerIndex];
    const roll = Math.max(1, Math.min(6, Math.floor(Number(result.roll) || 1)));
    const correct = result.correct === true;
    if (team === 'blue') next.teams.blue.positions[playerIndex] = correct ? Math.min(DESTINATION, next.teams.blue.positions[playerIndex] + roll) : Math.max(0, next.teams.blue.positions[playerIndex] - 1);
    else next.teams.red.positions[playerIndex] = correct ? Math.max(0, next.teams.red.positions[playerIndex] - roll) : Math.min(DESTINATION, next.teams.red.positions[playerIndex] + 1);
    if (!correct) {
      if (team === 'blue') next.teams.red.positions[playerIndex] = Math.max(0, next.teams.red.positions[playerIndex] - roll);
      else next.teams.blue.positions[playerIndex] = Math.min(DESTINATION, next.teams.blue.positions[playerIndex] + roll);
    }
    next.turn += 1;
    const blueAtStand = next.teams.blue.positions.every((position) => position >= DESTINATION);
    const redAtStand = next.teams.red.positions.every((position) => position <= 0);
    const serverOff = blueAtStand && redAtStand ? 'both' : blueAtStand ? 'red' : redAtStand ? 'blue' : null;
    next.log.unshift({ turn: next.turn, team, player, playerIndex, correct, roll, advancedOpponent: correct ? null : opponentPlayer, playerPosition: next.teams[team].positions[playerIndex], opponentPosition: correct ? null : next.teams[opponent].positions[playerIndex], bluePositions: next.teams.blue.positions.slice(), redPositions: next.teams.red.positions.slice(), serverOff });
    if (blueAtStand && redAtStand) next.outcome = 'draw';
    else if (blueAtStand) next.outcome = 'blue-win';
    else if (redAtStand) next.outcome = 'red-win';
    else if (next.turn >= next.maxTurns) next.outcome = 'draw';
    return next;
  }

  function skipRaceTurn(state) {
    if (!state || state.outcome || state.turn >= state.maxTurns) return state;
    const { team, player, playerIndex } = racePairing(state);
    const next = clone(state);
    next.turn += 1;
    next.log.unshift({ turn: next.turn, team, player, playerIndex, skipped: true,
      bluePositions: next.teams.blue.positions.slice(), redPositions: next.teams.red.positions.slice() });
    if (next.turn >= next.maxTurns) next.outcome = 'draw';
    return next;
  }

  function hackerPhase(hp, maxHp) {
    const ratio = Math.max(0, Number(hp) || 0) / Math.max(1, Number(maxHp) || 1);
    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'broken';
    if (ratio <= 0.75) return 'damaged';
    return 'armored';
  }

  function coopVictoryStage(startedAt, now = Date.now()) {
    const elapsed = Math.max(0, now - Number(startedAt || now));
    if (elapsed < 4200) return { stage: 'explosion', nextAt: Number(startedAt) + 4200 };
    if (elapsed < 7200) return { stage: 'message', nextAt: Number(startedAt) + 7200 };
    return { stage: 'button', nextAt: null };
  }

  function snapshotDeck(deck) {
    return clone(deck);
  }

  function randomOptionIndex(length, random = Math.random) {
    if (!Number.isInteger(length) || length < 1) return null;
    const sample = Math.min(1 - Number.EPSILON, Math.max(0, Number(random()) || 0));
    return Math.floor(sample * length);
  }

  function winner(players) {
    const eligible = players.filter((player) => player.seals.length === 5 && player.position >= DESTINATION);
    if (!eligible.length) return null;
    const max = Math.max(...eligible.map((player) => player.score));
    const leaders = eligible.filter((player) => player.score === max);
    return leaders.length === 1 ? leaders[0] : { tie: leaders };
  }

  function rankPodium(players = []) {
    const difficultyKeys = ['easy', 'medium', 'hard'];
    const weights = { easy: 1, medium: 2, hard: 3 };
    return (Array.isArray(players) ? players : [])
      .map((player, inputOrder) => {
        const correctByDifficulty = Object.fromEntries(difficultyKeys.map((key) => [key, Math.max(0, Math.floor(Number(player?.correctByDifficulty?.[key]) || 0))]));
        const correctAnswers = Math.max(0, Math.floor(Number(player?.correctAnswers) || Object.values(correctByDifficulty).reduce((sum, count) => sum + count, 0)));
        const wrongAnswers = Math.max(0, Math.floor(Number(player?.wrongAnswers) || 0));
        const points = difficultyKeys.reduce((sum, key) => sum + correctByDifficulty[key] * weights[key], 0);
        return { ...player, correctByDifficulty, correctAnswers, wrongAnswers, points, inputOrder };
      })
      .filter((player) => !player.isBot && player.kind !== 'bot')
      .sort((a, b) => b.points - a.points || b.correctAnswers - a.correctAnswers || a.wrongAnswers - b.wrongAnswers || (Number(a.seat) || 0) - (Number(b.seat) || 0) || a.inputOrder - b.inputOrder)
      .slice(0, 3)
      .map(({ inputOrder, ...player }, index) => ({ ...player, place: index + 1 }));
  }

  return { THEMES, CHECKPOINTS, DESTINATION, HEALING_SPACES, advanceOnRoute, pickCard, checkAnswer, randomOptionIndex, newCoopState, resolveCoopTurn, skipCoopTurn, useCoopHealingNode, newRaceState, racePairing, resolveRaceTurn, skipRaceTurn, hackerPhase, coopVictoryStage, snapshotDeck, winner, rankPodium, normalizeText };
});
