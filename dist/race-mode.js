(function (root) {
  const ROUTE = [[210, 640], [290, 640], [370, 640], [450, 640], [530, 640], [610, 640], [680, 570], [680, 500], [680, 430], [600, 430], [520, 430], [440, 430], [360, 430], [280, 430], [210, 360], [300, 320], [400, 320], [500, 320], [600, 320]];

  function render(game, ui) {
    const race = game.race;
    const turn = root.GameCore.racePairing(race) || { team: 'blue', player: 'Jogador', playerIndex: 0 };
    const { team, player, playerIndex } = turn;
    const teamName = team === 'blue' ? 'Azul' : 'Vermelha';
    const activeColor = game.players.find((item) => item.name === player)?.color || (team === 'blue' ? '#43d6ff' : '#ff657b');
    const progress = (side) => race.teams[side].positions.filter((position) => side === 'blue' ? position >= 18 : position <= 0).length;
    const roster = (side) => `<div class="race-team-roster" aria-label="Jogadores da equipe ${side === 'blue' ? 'azul' : 'vermelha'}">${race.teams[side].players.map((name, index) => {
      const colorIndex = (index + (side === 'red' ? 3 : 0)) % 6;
      const participant = game.players.find((item) => item.name === name) || { name, color: ui.playerColors[colorIndex] };
      const color = participant.color || ui.playerColors[colorIndex];
      const localPosition = side === 'blue' ? race.teams[side].positions[index] : 18 - race.teams[side].positions[index];
      const active = side === team && index === playerIndex;
      return `<span class="race-player-chip ${active ? 'is-active' : ''}">${ui.renderBoardPawnAvatar(Math.max(0, ui.playerColors.indexOf(color)), color)}<span>${ui.esc(name)}<small>CASA ${localPosition}</small></span></span>`;
    }).join('')}</div>`;
    const score = `<div class="race-team-strip"><div class="race-team blue"><b>AZUL · SERVIDOR VERMELHO</b><strong>${progress('blue')} / 3 no estande</strong>${roster('blue')}</div><i>VS</i><div class="race-team red"><b>VERMELHO · SERVIDOR AZUL</b><strong>${progress('red')} / 3 no estande</strong>${roster('red')}</div></div>`;

    let control = '';
    if (game.phase === 'race-roll') {
      control = `<section class="game-card race-roll-card"><div class="eyebrow">${game.onlineRoom ? (game.localPlayerId === game.players.find((item) => item.name === player)?.playerId ? 'SUA VEZ' : `VEZ DE ${ui.esc(player)}`) : 'PASSE O DISPOSITIVO'} · EQUIPE ${teamName.toUpperCase()} · TURNO ${race.turn + 1}</div><div class="race-active-player ${team}"><span class="race-active-avatar">${ui.renderBoardPawnAvatar(Math.max(0, ui.playerColors.indexOf(activeColor)), activeColor)}</span><div><small>PEÃO DE ${teamName.toUpperCase()}</small><b>${ui.esc(player)}</b></div><span>CASA ${team === 'blue' ? race.teams[team].positions[playerIndex] : 18 - race.teams[team].positions[playerIndex]}</span></div><p>Role o dado e responda. Os três precisam chegar ao servidor rival.</p><button class="btn btn-primary" data-action="race-roll">Rolar dado · 1–6</button></section>`;
    } else if (game.phase === 'race-feedback') {
      const event = game.raceLast;
      const playerPosition = event.playerPosition ?? race.teams[event.team].positions[event.playerIndex];
      const opponentPosition = event.opponentPosition ?? race.teams[event.team === 'blue' ? 'red' : 'blue'].positions[event.playerIndex];
      const headline = event.correct ? `${ui.esc(event.player)} avançou ${event.roll} casas` : `${ui.esc(event.player)} recuou 1 · ${ui.esc(event.advancedOpponent)} avançou ${event.roll}`;
      control = `<section class="game-card race-result-card ${event.correct ? '' : 'damage'}"><div class="eyebrow">${event.serverOff ? 'EQUIPE COMPLETA NO ESTANDE' : event.correct ? 'ACERTO · AVANÇO' : 'ERRO · CONTRA-AVANÇO'}</div><h2>${headline}</h2><p>${ui.esc(game.question.explanation)}</p><div class="race-damage">${event.correct ? `Peão na casa ${playerPosition}.` : `${ui.esc(event.advancedOpponent)} chegou à casa ${opponentPosition}.`}</div><button class="btn btn-primary" data-action="race-continue">Próximo turno</button></section>`;
    } else if (game.phase === 'question') {
      control = `<div class="race-active-player ${team}"><span class="race-active-avatar">${ui.renderBoardPawnAvatar(Math.max(0, ui.playerColors.indexOf(activeColor)), activeColor)}</span><div><small>JOGADOR DA EQUIPE ${teamName.toUpperCase()}</small><b>${ui.esc(player)}</b></div><span>TURNO ${race.turn + 1}</span></div>${ui.renderQuestion(game.question)}<div class="inline-help pass-hint">Acerto avança o dado. Erro recua seu peão e dá o avanço ao rival.</div>`;
    } else {
      control = `<section class="game-card race-result-card ${race.outcome === 'blue-win' ? 'team-blue' : race.outcome === 'red-win' ? 'team-red' : ''}"><div class="eyebrow">${race.outcome === 'draw' ? 'EMPATE · TEMPO ESGOTADO' : 'SERVIDORES DESLIGADOS'}</div><h2>${race.outcome === 'draw' ? 'Nenhuma equipe completou a rota.' : `Equipe ${race.outcome === 'blue-win' ? 'Azul' : 'Vermelha'} venceu!`}</h2><p>O servidor rival foi desconectado da tomada.</p><button class="btn btn-primary" data-action="leave-game">Voltar ao menu</button></section>`;
    }

    const winnerTone = game.race.outcome === 'blue-win' ? 'blue' : 'red';
    const finishOverlay = game.phase === 'race-shutdown' ? `<div class="race-victory-overlay team-${winnerTone}" role="status" aria-live="assertive"><div class="race-victory-content"><small>SERVIDOR DESCONECTADO</small><strong>EQUIPE ${game.race.outcome === 'blue-win' ? 'AZUL' : 'VERMELHA'}<br>GANHADORA</strong><span>Os três jogadores chegaram ao estande rival.</span></div></div>` : '';
    const roll = ui.renderRaceDiceTray(game.raceRoll, activeColor, Boolean(game.diceAnimating));
    return `<div class="game-world race-board-world"><header class="game-hud"><div class="hud-brand"><img class="game-brand-logo" src="assets/cyberrota-logo.svg" alt="Cyber Rota"><span class="game-brand-mode"><small>DESLIGUE O SERVIDOR · 3V3</small></span></div><div class="hud-center"><span class="round-badge">TURNO ${race.turn + 1}/${race.maxTurns}</span></div><button class="hud-sound" data-action="toggle-sound" aria-label="${ui.soundMuted ? 'Ativar' : 'Silenciar'} música e efeitos" title="${ui.soundMuted ? 'Ativar' : 'Silenciar'} música e efeitos" aria-pressed="${!ui.soundMuted}">${ui.uiIcon(ui.soundMuted ? 'volume-off' : 'volume')} ${ui.soundMuted ? 'Som desligado' : 'Som ligado'}</button><button class="hud-exit" data-action="leave-game">SAIR DA PARTIDA <span>×</span></button></header><div class="game-layout"><section class="world-stage race-world-stage"><div class="world-title"><span>DESLIGUE O SERVIDOR RIVAL</span><b>TRIO COMPLETO NO ESTANDE VENCE</b></div>${roll}${ui.renderBoardScene(game.players[0])}<div class="world-footer"><span>⌂ ESTANDE AZUL · SERVIDOR</span><span>6 PEÕES · ROTA 0–18</span><span>ESTANDE VERMELHO · SERVIDOR ⌂</span></div></section><aside class="game-control-dock"><div class="dock-top"><div><small>INVASÃO DA REDE</small><h1>Azul contra Vermelho</h1></div><span class="dock-live"><i></i> AO VIVO</span></div>${score}${control}</aside></div>${finishOverlay}</div>`;
  }

  function serverStand(team, x, y, off, shutdown) {
    const state = off ? 'server-is-off' : '';
    const labelY = team === 'red' ? 110 : 158;
    const labelX = team === 'red' ? -36 : 0;
    const socket = team === 'blue' ? { x: -48, y: 124, cable: 'M-40 52C-49 70-48 88-48 109' } : { x: 65, y: 105, cable: 'M48 54C75 58 87 78 76 95L65 90' };
    return `<g class="race-server-stand ${team} ${shutdown && off ? 'server-powering-down' : off ? state : ''}" transform="translate(${x} ${y})">
      <ellipse class="stand-shadow" cy="78" rx="82" ry="16"/>
      <path class="stand-plinth" d="M-70 44h140v28H-70z"/><path class="stand-plinth-top" d="m-70 44 26-16h140L70 44z"/>
      <path class="server-cable" d="${socket.cable}"/>
      <g class="server-socket" transform="translate(${socket.x} ${socket.y})"><rect x="-18" y="-15" width="36" height="28" rx="6"/><path d="M-6-5v8m12-8v8M0 3v4"/></g>
      <g class="server-rack" transform="translate(-8 -8)"><path class="rack-side" d="M35 0h46v84H35z"/><path class="rack-face" d="M-32 0h67v84h-67z"/><path class="rack-top" d="m-32 0 18-16h66L35 0z"/><path class="rack-foot" d="M-23 84v8m49-8v8"/>
        <g class="rack-leds"><circle cx="-18" cy="18" r="4"/><circle cx="-18" cy="37" r="4"/><circle cx="-18" cy="56" r="4"/><circle cx="-18" cy="74" r="4"/></g>
        <g class="rack-slots"><rect x="-8" y="12" width="34" height="12" rx="3"/><rect x="-8" y="31" width="34" height="12" rx="3"/><rect x="-8" y="50" width="34" height="12" rx="3"/><rect x="-8" y="69" width="34" height="8" rx="2"/></g>
        <circle class="rack-main-light" cx="12" cy="18" r="3"/><circle class="rack-main-light" cx="12" cy="37" r="3"/><circle class="rack-main-light" cx="12" cy="56" r="3"/><circle class="rack-main-light" cx="12" cy="73" r="2.5"/>
      </g>
      <g class="stand-beacon" transform="translate(8 -95)"><path d="M0 30V7"/><path class="beacon-dome" d="M-13 7a13 13 0 0 1 26 0z"/><circle class="beacon-core" cy="3" r="4"/></g>
      <text class="stand-label" x="${labelX}" y="${labelY}" text-anchor="middle">SERVIDOR ${team === 'blue' ? 'AZUL' : 'VERMELHO'}</text><text class="stand-status" x="${labelX}" y="${labelY + 18}" text-anchor="middle">${off ? 'SEM ENERGIA' : 'ATIVO · ONLINE'}</text>
    </g>`;
  }

  function boardScene(game, ui) {
    const line = ROUTE.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
    const nodes = ROUTE.map(([x, y], index) => `<g class="race-road-tile ${index === 0 ? 'start' : ''} ${index === 18 ? 'finish' : ''}" transform="translate(${x} ${y})"><path class="race-tile-shadow" d="M-32 6 0-13 32 6 0 25z"/><path class="race-tile-face" d="M-32-5 0-24 32-5 0 14z"/><text y="2">${index}</text></g>`).join('');
    const roster = ['blue', 'red'].flatMap((team) => game.race.teams[team].players.map((name, index) => ({ team, name, index, position: game.race.teams[team].positions[index] })));
    const pieces = roster.map(({ team, name, index, position }) => {
      const occupants = roster.filter((piece) => piece.position === position);
      const slot = occupants.findIndex((piece) => piece.team === team && piece.index === index);
      const count = occupants.length;
      const scale = count > 3 ? .48 : count === 3 ? .59 : .74;
      const layouts = count > 3
        ? [[-18, -14], [0, -14], [18, -14], [-18, 8], [0, 8], [18, 8]]
        : count === 3 ? [[-19, 0], [0, 0], [19, 0]]
          : count === 2 ? [[-11, 0], [11, 0]] : [[0, 0]];
      const [offsetX, offsetY] = layouts[slot] || [0, 0];
      const point = ROUTE[position];
      const player = game.players.find((item) => item.name === name) || { name, color: team === 'blue' ? ['#35c7ff', '#7e9bff', '#47e4c0'][index] : ['#ff667c', '#ffaf5c', '#ce8cff'][index] };
      const moving = game.phase === 'race-feedback' && game.raceLast?.player === name && game.raceLast?.team === team;
      return `<g class="race-board-pawn ${moving ? 'is-moving' : ''}" transform="translate(${point[0] + offsetX} ${point[1] - 12 + offsetY}) scale(${scale})" style="--pawn-color:${player.color}"><title>${ui.esc(name)} · casa ${position}</title>${ui.renderBoardPawn(Math.max(0, ui.playerColors.indexOf(player.color)), player.color)}</g>`;
    }).join('');
    const redOff = game.race.outcome === 'blue-win' || game.race.outcome === 'draw';
    const blueOff = game.race.outcome === 'red-win' || game.race.outcome === 'draw';
    const shutdown = game.phase === 'race-shutdown';
    return `<div class="isometric-scene race-board-scene" role="img" aria-label="Tabuleiro quadrado 3v3 com rota, seis peões, e um servidor conectado em cada estande"><svg class="board-svg board-competitive" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="race-floor" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#102a42"/><stop offset="1" stop-color="#081a2b"/></linearGradient><linearGradient id="race-road" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#183c5b"/><stop offset="1" stop-color="#0b2237"/></linearGradient><filter id="race-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path class="race-board-base" d="M44 44Q44 30 58 30h684q14 0 14 14v712q0 14-14 14H58q-14 0-14-14z"/><path class="race-board-inset" d="M64 64h672v672H64z"/>
      <path class="race-route-glow" d="${line}"/><path class="race-route" d="${line}"/><path class="race-route-center" d="${line}"/>
      ${nodes}
      <path class="race-stand-link blue" d="M180 640 140 580"/><path class="race-stand-link red" d="M630 320 625 250"/>
      ${serverStand('blue', 110, 565, blueOff, shutdown)}${serverStand('red', 665, 160, redOff, shutdown)}
      ${pieces}
      <path class="race-board-trace" d="M165 110h160l35 28h98M448 110h155M165 178h90m460 0h-82"/><circle class="race-board-node" cx="165" cy="110" r="5"/><circle class="race-board-node" cx="603" cy="110" r="5"/><text class="race-board-stamp" x="165" y="155">REDE AZUL · ROTA DE INVASÃO</text><text class="race-board-stamp red" x="603" y="155" text-anchor="end">UPLINK · REDE VERMELHA</text>
      <text class="race-route-caption" x="400" y="718" text-anchor="middle">TRILHA DE INVASÃO · CASA 0 — 18</text>
    </svg></div>`;
  }

  root.RaceMode = { render, boardScene, serverStand };
})(globalThis);
