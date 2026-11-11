(function (root) {
  function render(game, ui) {
    const race = game.race;
    const turn = root.GameCore.racePairing(race) || { team: 'blue', player: 'Jogador', playerIndex: 0 };
    const { team, player, playerIndex } = turn;
    const teamName = team === 'blue' ? 'Azul' : 'Vermelho';
    const progress = (side) => side === 'blue'
      ? Math.max(...race.teams.blue.positions)
      : root.GameCore.DESTINATION - Math.min(...race.teams.red.positions);
    const roster = (side) => `<div class="race-team-roster" aria-label="Jogadores da equipe ${side === 'blue' ? 'azul' : 'vermelha'}">${race.teams[side].players.map((name, index) => {
      const colorIndex = (index + (side === 'red' ? 3 : 0)) % 6;
      const participant = game.players.find((item) => item.name === name) || { name, color: ui.playerColors[colorIndex] };
      const color = participant.color || ui.playerColors[colorIndex];
      const position = race.teams[side].positions[index];
      const active = side === team && index === playerIndex;
      return `<span class="race-player-chip ${active ? 'is-active' : ''}">${ui.renderBoardPawnAvatar(Math.max(0, ui.playerColors.indexOf(color)), color)}<span>${ui.esc(name)}<small>CASA ${position}</small></span></span>`;
    }).join('')}</div>`;
    const score = `<div class="race-team-strip"><div class="race-team blue"><b>AZUL · BANDEIRA VERMELHA</b><strong>${progress('blue')} / 18 casas</strong>${roster('blue')}</div><i>VS</i><div class="race-team red"><b>VERMELHO · BANDEIRA AZUL</b><strong>${progress('red')} / 18 casas</strong>${roster('red')}</div></div>`;

    let control = '';
    if (game.phase === 'race-roll') {
      control = `<section class="game-card race-roll-card"><div class="eyebrow">PASSE O DISPOSITIVO · EQUIPE ${teamName.toUpperCase()} · TURNO ${race.turn + 1}</div><div class="race-active-player ${team}"><span class="robot-avatar ${team}">${ui.initials(player)}</span><div><small>PEÃO DE ${teamName.toUpperCase()}</small><b>${ui.esc(player)}</b></div><span>CASA ${race.teams[team].positions[playerIndex]}</span></div><p>Role o dado e responda para mover seu próprio peão.</p><button class="btn btn-primary" data-action="race-roll">Rolar dado · 1–6</button></section>`;
    } else if (game.phase === 'race-feedback') {
      const event = game.raceLast;
      const playerPosition = event.playerPosition ?? race.teams[event.team].positions[event.playerIndex];
      const opponentPosition = event.opponentPosition ?? race.teams[event.team === 'blue' ? 'red' : 'blue'].positions[event.playerIndex];
      const headline = event.correct
        ? `${ui.esc(event.player)} avançou ${event.roll} casas`
        : `${ui.esc(event.player)} recuou 1 · ${ui.esc(event.advancedOpponent)} avançou ${event.roll}`;
      control = `<section class="game-card race-result-card ${event.correct ? '' : 'damage'}"><div class="eyebrow">${event.captured ? 'BANDEIRA CAPTURADA' : event.correct ? 'ACERTO · AVANÇO' : 'ERRO · CONTRA-AVANÇO'}</div><h2>${headline}</h2><p>${ui.esc(game.question.explanation)}</p><div class="race-damage">${event.correct ? `Peão na casa ${playerPosition}.` : `${ui.esc(event.advancedOpponent)} chegou à casa ${opponentPosition}.`}</div><button class="btn btn-primary" data-action="race-continue">${race.outcome ? 'Ver resultado' : 'Próximo turno'}</button></section>`;
    } else {
      control = `<div class="race-active-player ${team}"><span class="robot-avatar ${team}">${ui.initials(player)}</span><div><small>JOGADOR DA EQUIPE ${teamName.toUpperCase()}</small><b>${ui.esc(player)}</b></div><span>TURNO ${race.turn + 1}</span></div><div class="race-roll-result" aria-label="Resultado do dado: ${game.raceRoll}"><b>DADO ${game.raceRoll}</b>${ui.renderDiePips(game.raceRoll)}</div>${ui.renderQuestion(game.question)}<div class="inline-help pass-hint">Acerto avança o dado. Erro recua seu peão e dá o avanço ao rival.</div>`;
    }

    return `<div class="game-world race-board-world"><header class="game-hud"><div class="hud-brand"><img class="game-brand-logo" src="assets/cyberrota-logo.svg" alt="Cyber Rota"><span class="game-brand-mode"><small>CAPTURA A BANDEIRA · 3V3</small></span></div><div class="hud-center"><span class="round-badge">TURNO ${race.turn + 1}/${race.maxTurns}</span></div><button class="hud-sound" data-action="toggle-sound" aria-label="${ui.soundMuted ? 'Ativar' : 'Silenciar'} música e efeitos" title="${ui.soundMuted ? 'Ativar' : 'Silenciar'} música e efeitos" aria-pressed="${!ui.soundMuted}">${ui.uiIcon(ui.soundMuted ? 'volume-off' : 'volume')} ${ui.soundMuted ? 'Som desligado' : 'Som ligado'}</button><button class="hud-exit" data-action="leave-game">SAIR DA PARTIDA <span>×</span></button></header><div class="game-layout"><section class="world-stage"><div class="world-title"><span>CAPTURE A BANDEIRA ADVERSÁRIA</span><b>ACERTE · ROLE · AVANCE</b></div>${ui.renderBoardScene(game.players[0])}<div class="world-footer"><span>⌂ BASE AZUL</span><span>SEIS PEÕES · CASAS 0–18</span><span>BASE VERMELHA ⌂</span></div></section><aside class="game-control-dock"><div class="dock-top"><div><small>CAPTURA DA BANDEIRA</small><h1>Azul contra Vermelho</h1></div><span class="dock-live"><i></i> AO VIVO</span></div>${score}${control}</aside></div></div>`;
  }

  function landmarks() {
    return `<g class="race-landmarks" aria-hidden="true"><g class="race-home-blue"><path d="m180 316 52-29 63 34-53 30Z" fill="#142b48" stroke="#76b4ff" stroke-width="3"/><path d="m180 316 0 28 62 35v-28Zm115 5v28l-53 30v-28Z" fill="#24476e" stroke="#4c85d0" stroke-width="2"/><path d="M220 288v-51m0 4 36 10-36 12Z" stroke="#b7d8ff" stroke-width="4"/><path d="m220 241 36 10-36 12Z" fill="#4389db"/><text class="zone-caption" x="215" y="393">BASE AZUL · SUA BANDEIRA</text></g><g class="race-home-red"><path d="m444 207 52-29 72 40-53 30Z" fill="#48232f" stroke="#ff9b94" stroke-width="3"/><path d="m444 207v27l71 40v-29Zm124 11v28l-53 28v-26Z" fill="#763345" stroke="#d86470" stroke-width="2"/><path d="M505 191v-51m0 4 36 10-36 12Z" stroke="#ffd0c4" stroke-width="4"/><path d="m505 144 36 10-36 12Z" fill="#d94d5c"/><text class="zone-caption" x="504" y="291">BASE VERMELHA · SUA BANDEIRA</text></g><path d="M280 287 364 245l73 42m58-44 68 37" fill="none" stroke="#6cb8ff" stroke-width="5" stroke-dasharray="5 10" opacity=".55"/><g class="arena-beacon"><path d="m473 342 30-19 32 19-31 18Z" fill="#d7f2e9" stroke="#648880" stroke-width="2"/><path d="m473 342v14l31 18v-14Zm62 0v14l-31 18v-14Z" fill="#456760"/><circle cx="504" cy="340" r="9" fill="#fff0a2" stroke="#fff" stroke-width="2"/></g><text class="zone-caption" x="503" y="382">ROTA DA BANDEIRA</text></g>`;
  }

  root.RaceMode = { render, landmarks };
})(globalThis);
