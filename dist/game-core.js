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
    if (blue.length !== 3 || red.length !== 3 || [...blue, ...red].some((name) => !name)) {
      throw new RangeError('A Corrida de Pacotes exige três jogadores por equipe.');
    }
    const startingHp = Math.max(1, Math.floor(Number(options.startingHp) || 10));
    const maxDuels = Math.max(1, Math.floor(Number(options.maxDuels) || 30));
    return {
      teams: {
        blue: { players: blue, hp: startingHp, correct: 0, position: 0, seals: [] },
        red: { players: red, hp: startingHp, correct: 0, position: 0, seals: [] },
      },
      startingHp,
      maxDuels,
      duel: 0,
      outcome: null,
      log: [],
    };
  }

  function racePairing(state) {
    if (!state || state.outcome) return null;
    return {
      blue: state.teams.blue.players[state.duel % 3],
      red: state.teams.red.players[state.duel % 3],
      first: state.duel % 2 === 0 ? 'blue' : 'red',
    };
  }

  function resolveRaceDuel(state, result) {
    if (!state || state.outcome || state.duel >= state.maxDuels) return state;
    const next = clone(state);
    const blueCorrect = result.blueCorrect === true;
    const redCorrect = result.redCorrect === true;
    if (blueCorrect) advanceRaceTeam(next.teams.blue);
    if (redCorrect) advanceRaceTeam(next.teams.red);
    let damaged = null;
    if (blueCorrect !== redCorrect) {
      damaged = blueCorrect ? 'red' : 'blue';
      next.teams[damaged].hp = Math.max(0, next.teams[damaged].hp - 1);
    }
    next.log.unshift({ duel: next.duel + 1, blueCorrect, redCorrect, damaged, bluePosition: next.teams.blue.position, redPosition: next.teams.red.position });
    next.duel += 1;
    const blueFinished = next.teams.blue.position >= DESTINATION && next.teams.blue.seals.length === THEMES.length;
    const redFinished = next.teams.red.position >= DESTINATION && next.teams.red.seals.length === THEMES.length;
    if (next.teams.blue.hp === 0 && next.teams.red.hp === 0) next.outcome = 'draw';
    else if (next.teams.blue.hp === 0) next.outcome = 'red-win';
    else if (next.teams.red.hp === 0) next.outcome = 'blue-win';
    else if (blueFinished && redFinished) next.outcome = 'draw';
    else if (blueFinished) next.outcome = 'blue-win';
    else if (redFinished) next.outcome = 'red-win';
    else if (next.duel >= next.maxDuels) {
      if (next.teams.blue.position > next.teams.red.position) next.outcome = 'blue-win';
      else if (next.teams.red.position > next.teams.blue.position) next.outcome = 'red-win';
      else if (next.teams.blue.hp > next.teams.red.hp) next.outcome = 'blue-win';
      else if (next.teams.red.hp > next.teams.blue.hp) next.outcome = 'red-win';
      else next.outcome = 'draw';
    }
    return next;
  }

  function advanceRaceTeam(team) {
    if (team.position >= DESTINATION) return;
    team.correct += 1;
    team.position += 1;
    const checkpointIndex = CHECKPOINTS.indexOf(team.position);
    if (checkpointIndex >= 0 && !team.seals.includes(THEMES[checkpointIndex].id)) team.seals.push(THEMES[checkpointIndex].id);
  }

  function hackerPhase(hp, maxHp) {
    const ratio = Math.max(0, Number(hp) || 0) / Math.max(1, Number(maxHp) || 1);
    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'broken';
    if (ratio <= 0.75) return 'damaged';
    return 'armored';
  }

  function snapshotDeck(deck) {
    return clone(deck);
  }

  function winner(players) {
    const eligible = players.filter((player) => player.seals.length === 5 && player.position >= DESTINATION);
    if (!eligible.length) return null;
    const max = Math.max(...eligible.map((player) => player.score));
    const leaders = eligible.filter((player) => player.score === max);
    return leaders.length === 1 ? leaders[0] : { tie: leaders };
  }

  return { THEMES, CHECKPOINTS, DESTINATION, HEALING_SPACES, advanceOnRoute, pickCard, checkAnswer, newCoopState, resolveCoopTurn, useCoopHealingNode, newRaceState, racePairing, resolveRaceDuel, hackerPhase, snapshotDeck, winner, normalizeText };
});
