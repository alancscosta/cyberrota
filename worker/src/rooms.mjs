import '../../dist/game-core.js';

const Core = globalThis.GameCore;
const ROOM_CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_DIGITS = '23456789';
const GAME_THEMES = Core.THEMES;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const PLAYER_COLORS = Object.freeze([
  { index: 0, name: 'Ciano', value: '#43d6ff' },
  { index: 1, name: 'Azul', value: '#769bff' },
  { index: 2, name: 'Dourado', value: '#ffbd68' },
  { index: 3, name: 'Lilás', value: '#d49bff' },
  { index: 4, name: 'Menta', value: '#72e0b3' },
  { index: 5, name: 'Coral', value: '#ff8e9b' },
]);

const ROOM_STATUSES = new Set(['lobby', 'playing', 'finished', 'closed']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roomError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

function normalizeName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 20) throw roomError('INVALID_NAME', 'Nome deve ter entre 1 e 20 caracteres.');
  return name;
}

function normalizeCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!/^(?=(?:[^A-Z]*[A-Z]){3}[^A-Z]*$)(?=(?:[^2-9]*[2-9]){3}[^2-9]*$)[A-HJ-NP-Z2-9]{6}$/.test(code)) throw roomError('INVALID_CODE', 'Código de sala inválido.');
  return code;
}

function validateColor(colorIndex) {
  const index = Number(colorIndex);
  if (!Number.isInteger(index) || index < 0 || index >= PLAYER_COLORS.length) {
    throw roomError('INVALID_COLOR', 'Escolha uma cor disponível.');
  }
  return index;
}

function validateMode(mode, capacity) {
  if (mode !== 'coop' && mode !== 'competitive') throw roomError('INVALID_MODE', 'Modo de sala inválido.');
  const requestedCapacity = Number(capacity ?? 6);
  if (!Number.isInteger(requestedCapacity)) throw roomError('INVALID_CAPACITY', 'Capacidade inválida.');
  if (mode === 'competitive' && requestedCapacity !== 6) {
    throw roomError('INVALID_CAPACITY', 'A Corrida 3v3 precisa de seis assentos.');
  }
  if (mode === 'coop' && (requestedCapacity < 2 || requestedCapacity > 6)) {
    throw roomError('INVALID_CAPACITY', 'Defenda a Rede aceita de duas a seis pessoas.');
  }
  return mode === 'competitive' ? 6 : requestedCapacity;
}

function assignTeam(players) {
  const blueCount = players.filter((player) => !player.isBot && player.team === 'blue').length;
  const redCount = players.filter((player) => !player.isBot && player.team === 'red').length;
  if (blueCount < redCount) return 'blue';
  if (redCount < blueCount) return 'red';
  const totalBlue = players.filter((player) => player.team === 'blue').length;
  const totalRed = players.filter((player) => player.team === 'red').length;
  return totalBlue <= totalRed ? 'blue' : 'red';
}

function availableColorIndex(players) {
  const used = new Set(players.map((player) => player.colorIndex));
  const color = PLAYER_COLORS.find((entry) => !used.has(entry.index));
  if (!color) throw roomError('ROOM_FULL', 'Não há cores disponíveis na sala.');
  return color.index;
}

function validateHumanCapacity(room) {
  const humans = room.players.filter((player) => !player.isBot);
  if (humans.length > room.capacity) throw roomError('ROOM_FULL', 'A sala está cheia.');
}

function validateDeck(room) {
  const deck = room.config?.deck;
  if (!Array.isArray(deck) || !deck.length) throw roomError('DECK_REQUIRED', 'Escolha um baralho com cartas antes de iniciar.');
  return clone(deck);
}

function chooseCard(game, { theme, difficulty, random = Math.random } = {}) {
  let card = Core.pickCard(game.deck, { theme, difficulty, chapter: game.chapter, avoidIds: game.usedIds, random });
  if (!card && theme) card = Core.pickCard(game.deck, { difficulty, chapter: game.chapter, avoidIds: game.usedIds, random });
  if (!card && difficulty) card = Core.pickCard(game.deck, { theme, chapter: game.chapter, avoidIds: game.usedIds, random });
  if (!card && difficulty) card = Core.pickCard(game.deck, { chapter: game.chapter, avoidIds: game.usedIds, random });
  if (!card && game.usedIds.length) {
    game.usedIds = [];
    card = Core.pickCard(game.deck, { theme, difficulty, chapter: game.chapter, random });
    if (!card) card = Core.pickCard(game.deck, { chapter: game.chapter, random });
  }
  return card ? clone(card) : null;
}

function currentRaceSeat(room, game) {
  const turn = Core.racePairing(game.race);
  if (!turn) return null;
  return room.players.filter((player) => player.team === turn.team)[turn.playerIndex] || null;
}

function currentPlayer(room, game) {
  if (game.mode === 'competitive') return currentRaceSeat(room, game);
  const player = game.players[game.coop.currentPlayer];
  return room.players.find((entry) => entry.playerId === player?.playerId) || null;
}

function makeGameState(room, { random = Math.random, now = Date.now() } = {}) {
  const deck = validateDeck(room);
  const roster = room.players.map((player) => ({
    playerId: player.playerId,
    name: player.name,
    team: player.team,
    colorIndex: player.colorIndex,
    isBot: Boolean(player.isBot),
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    correctByDifficulty: { easy: 0, medium: 0, hard: 0 },
    usedRoles: [],
  }));
  const game = {
    mode: room.mode,
    players: roster,
    phase: room.mode === 'competitive' ? 'race-roll' : 'walk',
    turn: 0,
    difficulty: room.config.difficulty ?? 'all',
    chapter: room.config.chapter ?? 'all',
    deck,
    usedIds: [],
    question: null,
    feedback: null,
    coopRoll: null,
    raceRoll: null,
    outcome: null,
    lastActorId: null,
    turnDeadlineAt: now + 20000,
    ...(room.mode === 'coop' ? {
      coop: Core.newCoopState(roster.filter((player) => !player.isBot).map((player) => player.name), {
        maxRounds: Number(room.config.maxRounds) || 24,
        hackerHp: Number(room.config.hackerHp) || 20,
        difficultyMode: room.config.difficultyMode || 'normal',
      }),
      attackTheme: GAME_THEMES[Math.floor(random() * GAME_THEMES.length)]?.id || GAME_THEMES[0].id,
      usedRoles: [],
      turns: 0,
    } : {
      race: Core.newRaceState(
        room.players.filter((player) => player.team === 'blue').map((player) => player.name),
        room.players.filter((player) => player.team === 'red').map((player) => player.name),
      ),
      turns: 0,
    }),
  };
  if (room.mode === 'coop') {
    game.coop.players = roster.filter((player) => !player.isBot).map((player) => ({ name: player.name, playerId: player.playerId, usedRoles: [] }));
    game.currentPlayerId = game.coop.players[0]?.playerId ?? null;
  }
  if (room.mode === 'competitive') prepareRaceTurn(room, game, random, now);
  return game;
}

function prepareRaceTurn(room, game, random = Math.random, now = Date.now()) {
  const desired = game.difficulty === 'all' ? 1 + (Math.floor(game.race.turn / 2) % 3) : Number(game.difficulty);
  const card = chooseCard(game, { difficulty: desired, random });
  if (!card) {
    game.phase = 'finished';
    game.race.outcome = 'draw';
    game.outcome = 'draw';
    return;
  }
  game.question = card;
  game.usedIds.push(card.id);
  const turn = Core.racePairing(game.race);
  game.raceCurrentTeam = turn.team;
  game.raceCurrentPlayer = turn.player;
  game.racePlayerIndex = turn.playerIndex;
  game.raceRoll = null;
  game.phase = 'race-roll';
  game.turnDeadlineAt = now + 20000;
  const seat = currentRaceSeat(room, game);
  game.currentPlayerId = seat?.playerId ?? null;
}

function recordAnswerForPlayer(player, correct, difficulty) {
  if (correct) {
    player.correctAnswers += 1;
    const key = Number(difficulty) >= 3 ? 'hard' : Number(difficulty) >= 2 ? 'medium' : 'easy';
    player.correctByDifficulty[key] += 1;
    player.score += Number(difficulty) || 1;
  } else player.wrongAnswers += 1;
}

function setCurrentTurn(room, game) {
  game.currentPlayerId = currentPlayer(room, game)?.playerId ?? null;
}

function summarizeAnswer(card, answer) {
  if ((card.type === 'mcq' || card.type === 'truefalse') && Array.isArray(card.options)) return card.options[Number(answer)] ?? String(answer);
  if (Array.isArray(answer)) return answer.join(' → ');
  return String(answer ?? '');
}

function resolveGameAnswer(room, game, player, answer, { forcedCorrect, random = Math.random } = {}) {
  const card = game.question;
  if (!card) throw roomError('NO_ACTIVE_QUESTION', 'Não há pergunta ativa.');
  const correct = typeof forcedCorrect === 'boolean' ? forcedCorrect : Core.checkAnswer(card, answer);
  recordAnswerForPlayer(game.players.find((entry) => entry.playerId === player.playerId), correct, card.difficulty);
  if (game.mode === 'coop') {
    const previousPosition = game.coop.position;
    const previousArmor = game.coop.armorStage;
    game.coop = Core.resolveCoopTurn(game.coop, { theme: card.theme, correct, difficulty: card.difficulty, roll: game.coopRoll });
    game.coop.moveFrom = correct ? previousPosition : null;
    game.coop.moveAnimationPlayed = false;
    game.coop.armorMotion = game.coop.armorStage > previousArmor
      ? { type: 'drop', from: previousArmor, to: game.coop.armorStage }
      : game.coop.armorStage < previousArmor ? { type: 'repair', from: previousArmor, to: game.coop.armorStage } : null;
    game.turns = game.coop.round;
    game.coopRoll = null;
    game.attackTheme = GAME_THEMES.filter((theme) => game.coop.servers[theme.id] > 0)[Math.floor(random() * Math.max(1, GAME_THEMES.filter((theme) => game.coop.servers[theme.id] > 0).length))]?.id || GAME_THEMES[0].id;
    game.phase = game.coop.outcome ? 'finished' : 'feedback';
    game.outcome = game.coop.outcome;
  } else {
    game.race = Core.resolveRaceTurn(game.race, { correct, roll: game.raceRoll });
    game.raceLast = game.race.log[0];
    game.raceRoll = null;
    game.turns = game.race.turn;
    game.phase = game.race.outcome && game.race.outcome !== 'draw' ? 'race-shutdown' : 'race-feedback';
    game.outcome = game.race.outcome;
  }
  game.feedback = { correct, card: clone(card), points: correct ? Number(card.difficulty) || 1 : 0, answer: summarizeAnswer(card, answer), playerId: player.playerId };
  game.lastActorId = player.playerId;
  delete game.turnDeadlineAt;
  setCurrentTurn(room, game);
  game.question = null;
  return game;
}

export function generateRoomCode(cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider?.getRandomValues) throw roomError('SECURE_RANDOM_UNAVAILABLE', 'Não foi possível gerar um código seguro.');
  const byte = new Uint8Array(1);
  const randomBelow = (limit) => {
    const ceiling = Math.floor(256 / limit) * limit;
    do { cryptoProvider.getRandomValues(byte); } while (byte[0] >= ceiling);
    return byte[0] % limit;
  };
  const characters = [
    ...Array.from({ length: 3 }, () => ROOM_CODE_LETTERS[randomBelow(ROOM_CODE_LETTERS.length)]),
    ...Array.from({ length: 3 }, () => ROOM_CODE_DIGITS[randomBelow(ROOM_CODE_DIGITS.length)]),
  ];
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const other = randomBelow(index + 1);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return characters.join('');
}

export function createRoomState({ code, mode = 'coop', capacity = 6, host, config = {}, createdAt = Date.now() }) {
  const roomCode = normalizeCode(code);
  const roomCapacity = validateMode(mode, capacity);
  if (!host?.playerId || !host?.resumeToken) throw roomError('INVALID_HOST', 'A sala precisa de uma identidade segura para o anfitrião.');
  const player = {
    playerId: String(host.playerId),
    accountId: host.accountId ? String(host.accountId) : null,
    name: normalizeName(host.name),
    colorIndex: validateColor(host.colorIndex),
    resumeToken: String(host.resumeToken),
    connected: true,
    isBot: false,
    team: mode === 'competitive' ? 'blue' : null,
    joinedAt: createdAt,
  };
  return {
    code: roomCode,
    mode,
    status: 'lobby',
    capacity: roomCapacity,
    hostPlayerId: player.playerId,
    createdAt,
    updatedAt: createdAt,
    startedAt: null,
    players: [player],
    config: clone(config),
    gameState: null,
    revision: 1,
  };
}

export function joinRoom(roomState, { playerId, accountId = null, resumeToken, name, colorIndex, now = Date.now() }) {
  const room = clone(roomState);
  if (room.status !== 'lobby') throw roomError('ROOM_NOT_JOINABLE', 'A sala não está aceitando novos participantes.');
  if (!playerId || !resumeToken) throw roomError('INVALID_PLAYER', 'Identidade de participante inválida.');
  if (room.players.some((player) => player.playerId === String(playerId))) throw roomError('PLAYER_EXISTS', 'Esse participante já está na sala.');
  const humans = room.players.filter((player) => !player.isBot);
  if (humans.length >= room.capacity) throw roomError('ROOM_FULL', 'A sala está cheia.');
  const color = validateColor(colorIndex);
  if (room.players.some((player) => player.colorIndex === color)) throw roomError('COLOR_TAKEN', 'Essa cor já foi escolhida.');
  const player = {
    playerId: String(playerId),
    accountId: accountId ? String(accountId) : null,
    name: normalizeName(name),
    colorIndex: color,
    resumeToken: String(resumeToken),
    connected: true,
    isBot: false,
    team: room.mode === 'competitive' ? assignTeam(humans) : null,
    joinedAt: now,
  };
  room.players.push(player);
  room.updatedAt = now;
  room.revision += 1;
  return { room, player: clone(player) };
}

export function chooseIdentity(roomState, playerId, { name, colorIndex, now = Date.now() }) {
  const room = clone(roomState);
  if (room.status !== 'lobby') throw roomError('ROOM_LOCKED', 'A identidade não pode mudar depois do início.');
  const player = room.players.find((entry) => entry.playerId === String(playerId) && !entry.isBot);
  if (!player) throw roomError('PLAYER_NOT_FOUND', 'Participante não encontrado.');
  const color = validateColor(colorIndex);
  if (room.players.some((entry) => entry.playerId !== player.playerId && entry.colorIndex === color)) {
    throw roomError('COLOR_TAKEN', 'Essa cor já foi escolhida.');
  }
  player.name = normalizeName(name);
  player.colorIndex = color;
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

export function configureRoom(roomState, actorPlayerId, { mode, capacity, config = {}, now = Date.now() }) {
  const room = clone(roomState);
  assertHost(room, actorPlayerId);
  if (room.status !== 'lobby') throw roomError('ROOM_LOCKED', 'As opções só podem mudar no lobby.');
  const nextMode = mode ?? room.mode;
  const nextCapacity = validateMode(nextMode, capacity ?? (nextMode === room.mode ? room.capacity : 6));
  if (room.players.filter((player) => !player.isBot).length > nextCapacity) {
    throw roomError('CAPACITY_BELOW_ROSTER', 'A capacidade não pode ficar abaixo do número de participantes.');
  }
  room.mode = nextMode;
  room.capacity = nextCapacity;
  if (nextMode === 'competitive') {
    const assigned = [];
    room.players = room.players.map((player) => {
      const team = player.team || assignTeam(assigned);
      const next = { ...player, team };
      assigned.push(next);
      return next;
    });
  } else room.players = room.players.map((player) => ({ ...player, team: null }));
  room.config = { ...room.config, ...clone(config) };
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

function assertHost(room, actorPlayerId) {
  const actor = room.players.find((player) => player.playerId === String(actorPlayerId) && !player.isBot);
  if (!actor || room.hostPlayerId !== actor.playerId) throw roomError('HOST_ONLY', 'Somente o anfitrião pode fazer isso.');
}

export function startRoom(roomState, actorPlayerId, { confirmEarly = false, config = {}, random = Math.random, now = Date.now() } = {}) {
  const room = clone(roomState);
  assertHost(room, actorPlayerId);
  if (room.status !== 'lobby') throw roomError('ROOM_NOT_LOBBY', 'A sala não está no lobby.');
  const humans = room.players.filter((player) => !player.isBot);
  if (room.mode === 'coop' && humans.length < 2) throw roomError('ROOM_MIN_PLAYERS', 'Defenda a Rede precisa de pelo menos duas pessoas.');
  if (humans.length < room.capacity && !confirmEarly) {
    throw roomError('ROOM_NOT_FULL', 'Ainda há vagas. Confirme o início antecipado.', { requiresConfirmation: true });
  }
  if (room.mode === 'competitive') {
    let botIndex = 1;
    while (room.players.length < 6) {
      const blue = room.players.filter((player) => player.team === 'blue').length;
      const red = room.players.filter((player) => player.team === 'red').length;
      const humanBlue = room.players.filter((player) => !player.isBot && player.team === 'blue').length;
      const humanRed = room.players.filter((player) => !player.isBot && player.team === 'red').length;
      const team = blue < red ? 'blue' : red < blue ? 'red' : humanBlue < humanRed ? 'blue' : humanRed < humanBlue ? 'red' : (random() < 0.5 ? 'blue' : 'red');
      const color = availableColorIndex(room.players);
      const player = {
        playerId: `bot-${room.code}-${botIndex}`,
        name: `Bot ${String(botIndex).padStart(2, '0')}`,
        colorIndex: color,
        resumeToken: null,
        connected: true,
        isBot: true,
        team,
        joinedAt: now,
      };
      room.players.push(player);
      botIndex += 1;
    }
  }
  room.config = { ...room.config, ...clone(config) };
  room.gameState = makeGameState(room, { random, now });
  room.status = 'playing';
  room.startedAt = now;
  room.updatedAt = now;
  room.revision += 1;
  if (room.gameState.phase === 'finished') room.status = 'finished';
  return room;
}

export function botCorrectness(random = Math.random) {
  return random() < 0.5;
}

export function reconnectRoom(roomState, resumeToken, now = Date.now()) {
  if (!resumeToken) throw roomError('INVALID_RESUME_TOKEN', 'Código de retomada inválido.');
  const room = clone(roomState);
  const player = room.players.find((entry) => !entry.isBot && entry.resumeToken === String(resumeToken));
  if (!player) throw roomError('INVALID_RESUME_TOKEN', 'Essa vaga não foi encontrada.');
  if (room.status === 'closed') throw roomError('ROOM_CLOSED', 'A sala foi encerrada.');
  player.connected = true;
  room.updatedAt = now;
  room.revision += 1;
  return { room, player: clone(player) };
}

export function disconnectRoom(roomState, playerId, now = Date.now()) {
  const room = clone(roomState);
  const player = room.players.find((entry) => entry.playerId === String(playerId) && !entry.isBot);
  if (!player) return room;
  player.connected = false;
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

function assertActiveTurn(room, game, actorPlayerId) {
  const active = currentPlayer(room, game);
  if (!active || active.playerId !== String(actorPlayerId)) throw roomError('NOT_ACTIVE_PLAYER', 'Ainda não é a sua vez.');
  return active;
}

function selectCoopQuestion(game, difficulty, random = Math.random) {
  const card = chooseCard(game, { theme: game.attackTheme, difficulty: Number(difficulty), random });
  if (!card) throw roomError('NO_ELIGIBLE_CARDS', 'Não há cartas para essa escolha.');
  card.difficulty = Number(difficulty);
  card.theme = card.theme || game.attackTheme;
  game.question = card;
  game.usedIds.push(card.id);
  game.phase = 'question';
  return game;
}

function continueGame(room, game, random = Math.random, now = Date.now()) {
  if (game.mode === 'coop') {
    if (game.phase !== 'feedback') throw roomError('INVALID_GAME_PHASE', 'A rodada ainda não está pronta para continuar.');
    if (game.coop.outcome) {
      game.phase = 'finished';
      game.outcome = game.coop.outcome;
      room.status = 'finished';
      return game;
    }
    game.coop.moveFrom = null;
    game.coop.moveAnimationPlayed = false;
    game.coop.armorMotion = null;
    game.feedback = null;
    game.question = null;
    game.phase = 'walk';
    game.turnDeadlineAt = now + 20000;
    setCurrentTurn(room, game);
    return game;
  }
  if (game.phase === 'race-shutdown') {
    game.phase = 'finished';
    game.outcome = game.race.outcome;
    room.status = 'finished';
    return game;
  }
  if (game.phase !== 'race-feedback') throw roomError('INVALID_GAME_PHASE', 'A jogada ainda não está pronta para continuar.');
  if (game.race.outcome) {
    game.phase = 'finished';
    game.outcome = game.race.outcome;
    room.status = 'finished';
    return game;
  }
  game.feedback = null;
  game.raceLast = null;
  prepareRaceTurn(room, game, random, now);
  setCurrentTurn(room, game);
  return game;
}

export function applyGameCommand(roomState, actorPlayerId, action, payload = {}, { random = Math.random, now = Date.now() } = {}) {
  const room = clone(roomState);
  if (room.status !== 'playing') throw roomError('MATCH_NOT_PLAYING', 'A partida não está ativa.');
  const game = room.gameState;
  if (!game) throw roomError('INVALID_GAME_STATE', 'Estado de partida ausente.');
  const actor = room.players.find((player) => player.playerId === String(actorPlayerId) && !player.isBot);
  if (!actor) throw roomError('PLAYER_NOT_FOUND', 'Participante não encontrado.');

  if (action === 'game.continue') {
    if (game.phase === 'race-feedback' || game.phase === 'race-shutdown' || (game.mode === 'coop' && game.phase === 'feedback')) {
      if (game.lastActorId !== actor.playerId && room.hostPlayerId !== actor.playerId) throw roomError('NOT_ALLOWED', 'Somente quem concluiu a jogada ou o anfitrião pode continuar.');
      continueGame(room, game, random, now);
    } else throw roomError('INVALID_GAME_PHASE', 'A partida ainda não está pronta para continuar.');
  } else {
    assertActiveTurn(room, game, actorPlayerId);
    if (action === 'game.roll') {
      if (game.mode === 'coop' && game.phase === 'walk') {
        game.coopRoll = 1 + Math.floor(random() * 3);
        game.lastRoll = game.coopRoll;
        game.phase = 'choose-difficulty';
        game.turnDeadlineAt = now + 20000;
      } else if (game.mode === 'competitive' && game.phase === 'race-roll') {
        game.raceRoll = 1 + Math.floor(random() * 6);
        game.lastRoll = game.raceRoll;
        game.phase = 'question';
        game.turnDeadlineAt = now + 20000;
      } else throw roomError('INVALID_GAME_PHASE', 'Não é possível rolar o dado agora.');
      game.lastActorId = actor.playerId;
    } else if (action === 'game.choose-difficulty') {
      if (game.mode !== 'coop' || game.phase !== 'choose-difficulty') throw roomError('INVALID_GAME_PHASE', 'Não é possível escolher a dificuldade agora.');
      const difficulty = Number(payload.difficulty);
      if (![1, 2, 3].includes(difficulty)) throw roomError('INVALID_DIFFICULTY', 'Escolha uma dificuldade válida.');
      selectCoopQuestion(game, difficulty, random);
      game.turnDeadlineAt = now + 20000;
      game.lastActorId = actor.playerId;
    } else if (action === 'game.answer') {
      if (game.phase !== 'question') throw roomError('INVALID_GAME_PHASE', 'Não há pergunta aguardando resposta.');
      if (payload.answer === undefined || payload.answer === null || payload.answer === '' || (Array.isArray(payload.answer) && !payload.answer.length)) {
        throw roomError('EMPTY_ANSWER', 'Escolha uma resposta antes de confirmar.');
      }
      resolveGameAnswer(room, game, actor, payload.answer, { random });
      if (room.mode === 'coop' && game.coop.outcome) room.status = 'finished';
      game.lastActorId = actor.playerId;
    } else if (action === 'game.skip') {
      if (game.mode === 'coop' && ['walk', 'choose-difficulty', 'question'].includes(game.phase)) {
        game.coop = Core.skipCoopTurn(game.coop);
        game.turns = game.coop.round;
        game.phase = game.coop.outcome ? 'finished' : 'walk';
        game.outcome = game.coop.outcome;
        game.question = null;
        game.feedback = null;
        game.coopRoll = null;
        delete game.turnDeadlineAt;
        if (game.coop.outcome) room.status = 'finished';
        else { game.turnDeadlineAt = now + 20000; setCurrentTurn(room, game); }
      } else if (game.mode === 'competitive' && ['race-roll', 'question'].includes(game.phase)) {
        game.race = Core.skipRaceTurn(game.race);
        game.turns = game.race.turn;
        game.raceRoll = null;
        game.question = null;
        delete game.turnDeadlineAt;
        if (game.race.outcome) { game.phase = 'finished'; game.outcome = game.race.outcome; room.status = 'finished'; }
        else { prepareRaceTurn(room, game, random, now); setCurrentTurn(room, game); }
      } else throw roomError('INVALID_GAME_PHASE', 'Não é possível pular essa etapa.');
      game.lastActorId = actor.playerId;
    } else if (action === 'game.heal') {
      if (game.mode !== 'coop' || game.phase !== 'walk') throw roomError('INVALID_GAME_PHASE', 'Não é possível usar o nó de cura agora.');
      const healed = Core.useCoopHealingNode(game.coop, payload.nodeId);
      if (healed === game.coop) throw roomError('INVALID_HEALING_NODE', 'Esse nó não pode ser usado agora.');
      game.coop = healed;
      game.lastActorId = actor.playerId;
    } else throw roomError('UNKNOWN_GAME_ACTION', 'Ação de jogo desconhecida.');
  }
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

export function nextMatch(roomState, actorPlayerId, now = Date.now()) {
  const room = clone(roomState);
  assertHost(room, actorPlayerId);
  if (room.status !== 'finished') throw roomError('MATCH_NOT_FINISHED', 'A próxima partida só pode começar após o fim.');
  room.players = room.players.filter((player) => !player.isBot).map((player) => ({ ...player, connected: Boolean(player.connected), team: room.mode === 'competitive' ? player.team : null }));
  room.status = 'lobby';
  room.startedAt = null;
  room.gameState = null;
  delete room.botDueAt;
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

export function closeRoom(roomState, actorPlayerId, now = Date.now()) {
  const room = clone(roomState);
  assertHost(room, actorPlayerId);
  room.status = 'closed';
  room.gameState = null;
  delete room.botDueAt;
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

export function transferHost(roomState, currentHostId, now = Date.now()) {
  const room = clone(roomState);
  if (room.hostPlayerId !== String(currentHostId)) throw roomError('HOST_ONLY', 'Somente o anfitrião pode transferir a sala.');
  const successor = room.players.find((player) => !player.isBot && player.playerId !== room.hostPlayerId);
  if (!successor) return closeRoom(room, currentHostId, now);
  room.hostPlayerId = successor.playerId;
  room.updatedAt = now;
  room.revision += 1;
  return room;
}

export function transferHostForDeletedAccount(roomState, accountId, now = Date.now()) {
  const room = clone(roomState);
  const affected = room.players.filter((player) => player.accountId === String(accountId));
  if (!affected.length) return { room, oldHostId: null, newHostId: room.hostPlayerId, changed: false };
  const oldHostId = affected.some((player) => player.playerId === room.hostPlayerId) ? room.hostPlayerId : null;
  if (oldHostId) {
    const successor = room.players.filter((player) => !player.isBot && player.accountId !== String(accountId) && player.playerId !== oldHostId)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (successor) room.hostPlayerId = successor.playerId;
    else room.status = 'closed';
  }
  const deletedPlayerIds = new Set(affected.map((player) => player.playerId));
  room.players = room.players.map((player) => player.accountId === String(accountId)
    ? { ...player, accountId: null, name: 'Jogador', connected: false }
    : player);
  if (room.gameState?.players) {
    room.gameState.players = room.gameState.players.map((player) => deletedPlayerIds.has(player.playerId) ? { ...player, name: 'Jogador' } : player);
    if (room.gameState.coop?.players) room.gameState.coop.players = room.gameState.coop.players.map((player) => deletedPlayerIds.has(player.playerId) ? { ...player, name: 'Jogador' } : player);
    if (room.gameState.race) {
      room.gameState.race.teams.blue.players = room.players.filter((player) => player.team === 'blue').map((player) => player.name);
      room.gameState.race.teams.red.players = room.players.filter((player) => player.team === 'red').map((player) => player.name);
    }
  }
  room.updatedAt = now;
  room.revision += 1;
  return { room, oldHostId, newHostId: room.hostPlayerId, changed: true };
}

function publicGameState(gameState) {
  if (!gameState) return null;
  const game = clone(gameState);
  delete game.deck;
  delete game.usedIds;
  if (game.question) {
    delete game.question.answer;
    delete game.question.acceptedAnswers;
  }
  if (game.feedback?.card) {
    delete game.feedback.card.answer;
    delete game.feedback.card.acceptedAnswers;
  }
  return game;
}

function publicRoomConfig(config) {
  const safe = { ...(config || {}) };
  delete safe.deck;
  return safe;
}

export function publicRoomSnapshot(roomState) {
  const room = clone(roomState);
  return {
    code: room.code,
    mode: room.mode,
    status: room.status,
    capacity: room.capacity,
    hostPlayerId: room.hostPlayerId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    startedAt: room.startedAt,
    config: publicRoomConfig(room.config),
    gameState: publicGameState(room.gameState),
    revision: room.revision,
    players: room.players.map(({ resumeToken, accountId, ...player }) => player),
  };
}

export function accountRoomRows(roomState) {
  if (!roomState || roomState.status === 'closed') return [];
  return roomState.players.filter((player) => player.accountId).map((player) => ({
    accountId: player.accountId,
    roomCode: roomState.code,
    playerId: player.playerId,
    isHost: player.playerId === roomState.hostPlayerId,
  }));
}

function randomToken() {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function jsonResponse(value, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } });
}

export class RoomDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;
  }

  async getRoom() {
    return this.storage.get('room');
  }

  async saveRoom(room) {
    await this.storage.put('room', room);
    if (this.storage.setAlarm) {
      if (room.status === 'closed') await this.storage.deleteAlarm?.();
      else {
        const expiresAt = (Number(room.updatedAt) || Date.now()) + ROOM_TTL_MS;
        const botAt = Number(room.botDueAt) || Number.POSITIVE_INFINITY;
        const turnAt = Number(room.gameState?.turnDeadlineAt) || Number.POSITIVE_INFINITY;
        await this.storage.setAlarm(Math.max(Date.now() + 500, Math.min(expiresAt, botAt, turnAt)));
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/initialize' && request.method === 'POST') {
      if (await this.getRoom()) return jsonResponse({ error: 'ROOM_ALREADY_INITIALIZED' }, 409);
      const body = await request.json();
      const room = createRoomState(body);
      await this.saveRoom(room);
      return jsonResponse({ snapshot: publicRoomSnapshot(room), player: room.players[0], accountRooms: accountRoomRows(room) });
    }
    if (url.pathname === '/initialize-rotated' && request.method === 'POST') {
      if (await this.getRoom()) return jsonResponse({ error: 'ROOM_ALREADY_INITIALIZED' }, 409);
      const { room } = await request.json();
      if (!room || normalizeCode(room.code) !== room.code || room.status !== 'lobby' || !Array.isArray(room.players) || !room.players.length) {
        return jsonResponse({ error: 'INVALID_ROTATED_ROOM', message: 'Não foi possível transferir esta sala.' }, 400);
      }
      delete room.rotationPending;
      await this.saveRoom(room);
      return jsonResponse({ snapshot: publicRoomSnapshot(room), accountRooms: accountRoomRows(room) });
    }
    const room = await this.getRoom();
    if (!room) return jsonResponse({ error: 'ROOM_NOT_FOUND' }, 404);
    if (room.movedTo) return jsonResponse({ error: 'ROOM_MOVED', message: `O código da sala agora é ${room.movedTo}.`, newCode: room.movedTo }, 410);
    if (url.pathname === '/rotation/prepare' && request.method === 'POST') {
      const body = await request.json();
      const player = room.players.find((entry) => !entry.isBot && entry.resumeToken === body.resumeToken);
      if (!player) return jsonResponse({ error: 'INVALID_RESUME_TOKEN', message: 'Não foi possível validar sua vaga.' }, 400);
      if (player.playerId !== room.hostPlayerId) return jsonResponse({ error: 'HOST_ONLY', message: 'Somente o anfitrião pode gerar outro código.' }, 403);
      if (room.status !== 'lobby') return jsonResponse({ error: 'ROOM_NOT_LOBBY', message: 'Só é possível trocar o código antes da partida.' }, 409);
      if (room.rotationPending) return jsonResponse({ error: 'ROTATION_IN_PROGRESS', message: 'Já existe uma troca de código em andamento.' }, 409);
      let targetCode;
      try { targetCode = normalizeCode(body.targetCode); }
      catch (error) { return jsonResponse({ error: error.code, message: error.message }, 400); }
      if (targetCode === room.code) return jsonResponse({ error: 'SAME_ROOM_CODE', message: 'Gere um código diferente do atual.' }, 400);
      const rotationToken = randomToken();
      room.rotationPending = { targetCode, rotationToken };
      await this.saveRoom(room);
      return jsonResponse({ room, rotationToken });
    }
    if (url.pathname === '/rotation/cancel' && request.method === 'POST') {
      const body = await request.json();
      if (room.rotationPending?.rotationToken === body.rotationToken) {
        delete room.rotationPending;
        await this.saveRoom(room);
      }
      return jsonResponse({ cancelled: true });
    }
    if (url.pathname === '/rotation/commit' && request.method === 'POST') {
      const body = await request.json();
      const player = room.players.find((entry) => !entry.isBot && entry.resumeToken === body.resumeToken);
      if (!player || player.playerId !== room.hostPlayerId) return jsonResponse({ error: 'HOST_ONLY', message: 'Somente o anfitrião pode gerar outro código.' }, 403);
      if (!room.rotationPending || room.rotationPending.rotationToken !== body.rotationToken || room.rotationPending.targetCode !== body.newCode) {
        return jsonResponse({ error: 'ROTATION_EXPIRED', message: 'A troca do código expirou. Tente novamente.' }, 409);
      }
      if (!body.newRoom || body.newRoom.code !== body.newCode || body.newRoom.status !== 'lobby') {
        return jsonResponse({ error: 'INVALID_ROTATED_ROOM', message: 'Não foi possível transferir esta sala.' }, 400);
      }
      room.movedTo = body.newCode;
      room.status = 'closed';
      room.updatedAt = Date.now();
      room.revision += 1;
      delete room.rotationPending;
      await this.saveRoom(room);
      const event = JSON.stringify({ type: 'room.moved', newCode: body.newCode, snapshot: publicRoomSnapshot(body.newRoom) });
      for (const socket of this.state.getWebSockets()) { try { socket.send(event); } catch { /* A conexão será removida pelo runtime. */ } }
      return jsonResponse({ newCode: body.newCode, snapshot: publicRoomSnapshot(body.newRoom) });
    }
    if (url.pathname === '/rotation/abort' && request.method === 'POST') {
      room.status = 'closed';
      room.movedTo = null;
      room.updatedAt = Date.now();
      room.revision += 1;
      await this.saveRoom(room);
      return jsonResponse({ aborted: true });
    }
    if (url.pathname === '/snapshot' && request.method === 'GET') {
      return jsonResponse({ snapshot: publicRoomSnapshot(room) });
    }
    if (url.pathname === '/join' && request.method === 'POST') {
      if (room.rotationPending) return jsonResponse({ error: 'ROOM_ROTATING', message: 'O anfitrião está trocando o código da sala. Tente novamente.' }, 409);
      const body = await request.json();
      try {
        const player = { playerId: crypto.randomUUID(), accountId: body.accountId || null, resumeToken: randomToken(), name: body.name, colorIndex: body.colorIndex };
        const joined = joinRoom(room, player);
        await this.saveRoom(joined.room);
        await this.broadcast(joined.room);
        return jsonResponse({ snapshot: publicRoomSnapshot(joined.room), player: joined.player, accountRooms: accountRoomRows(joined.room) });
      } catch (error) { return jsonResponse({ error: error.code || 'JOIN_FAILED', message: error.message }, error.code === 'ROOM_FULL' ? 409 : 400); }
    }
    if (url.pathname === '/command' && request.method === 'POST') {
      const body = await request.json();
      try {
        if (room.rotationPending) throw roomError('ROOM_ROTATING', 'O anfitrião está trocando o código da sala. Tente novamente.');
        const player = room.players.find((entry) => !entry.isBot && entry.resumeToken === body.resumeToken);
        if (!player) throw roomError('INVALID_RESUME_TOKEN', 'Não foi possível validar sua vaga.');
        const updated = this.applyCommand(room, player, body.action, body.payload || {});
        await this.saveRoom(updated);
        await this.broadcast(updated);
        await this.scheduleBotAction(updated);
        return jsonResponse({ snapshot: publicRoomSnapshot(updated), accountRooms: accountRoomRows(updated) });
      } catch (error) { return jsonResponse({ error: error.code || 'COMMAND_FAILED', message: error.message, requiresConfirmation: error.requiresConfirmation }, error.code === 'ROOM_NOT_FULL' ? 409 : 400); }
    }
    if (url.pathname === '/ws' && request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      server.serializeAttachment({ playerId: null });
      return new Response(null, { status: 101, webSocket: client });
    }
    return jsonResponse({ error: 'NOT_FOUND' }, 404);
  }

  applyCommand(room, player, action, payload) {
    if (action === 'player.identity') return chooseIdentity(room, player.playerId, payload);
    if (action === 'room.configure') return configureRoom(room, player.playerId, payload);
    if (action === 'room.start') return startRoom(room, player.playerId, payload);
    if (action === 'room.next-match') return nextMatch(room, player.playerId);
    if (action === 'room.close') return closeRoom(room, player.playerId);
    if (action === 'room.transfer-host') return transferHost(room, player.playerId);
    if (action.startsWith('game.')) return applyGameCommand(room, player.playerId, action, payload);
    throw roomError('UNKNOWN_ACTION', 'Ação de sala desconhecida.');
  }

  async scheduleBotAction(room) {
    if (room.status !== 'playing' || room.mode !== 'competitive') return;
    const game = room.gameState;
    const current = room.players.find((player) => player.playerId === game?.currentPlayerId);
    const isBotTurn = Boolean(current?.isBot && game.phase === 'race-roll');
    const botFeedback = Boolean(game?.lastActorId?.startsWith('bot-') && ['race-feedback', 'race-shutdown'].includes(game.phase));
    if (isBotTurn || botFeedback) room.botDueAt = Date.now() + (botFeedback ? 1300 : 900);
    else delete room.botDueAt;
    await this.saveRoom(room);
  }

  async alarm() {
    const room = await this.getRoom();
    if (!room || room.status === 'closed') return;
    if (Date.now() - (Number(room.updatedAt) || 0) >= ROOM_TTL_MS) {
      room.status = 'closed';
      room.players = [];
      room.gameState = null;
      delete room.botDueAt;
      room.updatedAt = Date.now();
      room.revision += 1;
      await this.saveRoom(room);
      await this.broadcast(room);
      return;
    }
    if (room.status !== 'playing') { await this.saveRoom(room); return; }
    const game = room.gameState;
    if (Number(game?.turnDeadlineAt) && game.turnDeadlineAt <= Date.now()) {
      const active = currentPlayer(room, game);
      if (active && !active.isBot) {
        const skipped = applyGameCommand(room, active.playerId, 'game.skip', {}, { now: Date.now() });
        await this.saveRoom(skipped);
        await this.broadcast(skipped);
        await this.scheduleBotAction(skipped);
        return;
      }
    }
    if (room.mode !== 'competitive') { await this.saveRoom(room); return; }
    if (room.botDueAt && room.botDueAt > Date.now()) {
      await this.saveRoom(room);
      return;
    }
    delete room.botDueAt;
    if (game.phase === 'race-feedback' && game.race?.outcome && game.lastActorId?.startsWith('bot-')) {
      game.phase = 'finished';
      game.outcome = game.race.outcome;
      room.status = 'finished';
    } else if (game.phase === 'race-feedback' && game.lastActorId?.startsWith('bot-')) {
      continueGame(room, game);
    } else if (game.phase === 'race-shutdown' && game.lastActorId?.startsWith('bot-')) {
      continueGame(room, game);
    } else if (game.phase === 'race-roll' && game.currentPlayerId?.startsWith('bot-')) {
      const bot = room.players.find((player) => player.playerId === game.currentPlayerId);
      if (!bot || !game.question) return;
      game.raceRoll = 1 + Math.floor(Math.random() * 6);
      game.lastRoll = game.raceRoll;
      game.phase = 'question';
      resolveGameAnswer(room, game, bot, null, { forcedCorrect: botCorrectness() });
    } else { await this.saveRoom(room); return; }
    room.updatedAt = Date.now();
    room.revision += 1;
    await this.saveRoom(room);
    await this.broadcast(room);
    await this.scheduleBotAction(room);
  }

  async transferHostForDeletedAccount(accountId) {
    const room = await this.getRoom();
    if (!room) return { changed: false, oldHostId: null, newHostId: null, accountRooms: [] };
    const result = transferHostForDeletedAccount(room, accountId);
    if (!result.changed) return { changed: false, oldHostId: result.oldHostId, newHostId: result.newHostId, accountRooms: accountRoomRows(result.room) };
    await this.saveRoom(result.room);
    await this.broadcast(result.room);
    return { changed: true, oldHostId: result.oldHostId, newHostId: result.newHostId, snapshot: publicRoomSnapshot(result.room), accountRooms: accountRoomRows(result.room) };
  }

  async broadcast(room) {
    const message = JSON.stringify({ type: room.status === 'closed' ? 'room.closed' : 'room.snapshot', snapshot: publicRoomSnapshot(room) });
    for (const socket of this.state.getWebSockets()) {
      try { socket.send(message); } catch { /* A conexão será removida quando o runtime emitir close. */ }
    }
  }

  async webSocketMessage(socket, message) {
    let body;
    try { body = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message)); }
    catch { socket.send(JSON.stringify({ type: 'error', error: 'INVALID_MESSAGE' })); return; }
    let attachment = socket.deserializeAttachment() || { playerId: null };
    if (body.action === 'resume') {
      const room = await this.getRoom();
      try {
        const result = reconnectRoom(room, body.resumeToken);
        await this.saveRoom(result.room);
        attachment = { playerId: result.player.playerId };
        socket.serializeAttachment(attachment);
        const snapshot = publicRoomSnapshot(result.room);
        socket.send(JSON.stringify({ type: 'room.resumed', player: snapshot.players.find((entry) => entry.playerId === result.player.playerId), snapshot }));
        await this.broadcast(result.room);
      } catch (error) { socket.send(JSON.stringify({ type: 'error', error: error.code || 'RESUME_FAILED', message: error.message })); }
      return;
    }
    if (!attachment.playerId) { socket.send(JSON.stringify({ type: 'error', error: 'RESUME_REQUIRED' })); return; }
    const room = await this.getRoom();
    const player = room.players.find((entry) => entry.playerId === attachment.playerId);
    if (!player) { socket.send(JSON.stringify({ type: 'error', error: 'PLAYER_NOT_FOUND' })); return; }
    try {
      const updated = this.applyCommand(room, player, body.action, body.payload || {});
      await this.saveRoom(updated);
      await this.broadcast(updated);
        await this.scheduleBotAction(updated);
    } catch (error) {
      socket.send(JSON.stringify({ type: 'error', error: error.code || 'COMMAND_FAILED', message: error.message, requiresConfirmation: error.requiresConfirmation }));
    }
  }

  async webSocketClose(socket) {
    const attachment = socket.deserializeAttachment() || {};
    if (!attachment.playerId) return;
    const room = await this.getRoom();
    const updated = disconnectRoom(room, attachment.playerId);
    await this.saveRoom(updated);
    await this.broadcast(updated);
  }

  async webSocketError(socket) {
    return this.webSocketClose(socket);
  }
}

export { roomError };
