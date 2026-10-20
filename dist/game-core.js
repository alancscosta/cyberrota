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
      round: 1,
      maxRounds: options.maxRounds || 12,
      hackerHp: options.hackerHp || 20,
      servers: Object.fromEntries(THEMES.map(({ id }) => [id, 100])),
      alerts: 0,
      outcome: null,
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
      next.hackerHp = Math.max(0, next.hackerHp - difficulty - 1);
      next.log.unshift({ outcome: 'correct', theme, round: next.round, difficulty });
      if (next.hackerHp === 0) next.outcome = 'win';
    } else {
      next.servers[theme] = Math.max(0, next.servers[theme] - 25);
      next.alerts += 1;
      next.log.unshift({ outcome: 'incorrect', theme, round: next.round, difficulty });
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

  return { THEMES, CHECKPOINTS, DESTINATION, advanceOnRoute, pickCard, checkAnswer, newCoopState, resolveCoopTurn, snapshotDeck, winner, normalizeText };
});
