const ROUTE = [[92,310],[140,350],[190,390],[250,430],[320,470],[400,500],[480,520],[560,500],[640,470],[710,430],[780,390],[840,350],[900,310],[850,265],[780,220],[700,180],[610,145],[510,115],[410,100]];
const THEMES = [
  { id: 'fisica', label: 'Física', color: '#6ed5ff' },
  { id: 'rede', label: 'Rede', color: '#8fa9ff' },
  { id: 'transporte', label: 'Transporte', color: '#ffbf73' },
  { id: 'aplicacao', label: 'Aplicação', color: '#d2a1ff' },
  { id: 'seguranca', label: 'Segurança', color: '#75e0b5' },
];

function pawn(index, color) {
  const head = ['<circle cx="0" cy="-17" r="7"/>', '<rect x="-7" y="-24" width="14" height="14" rx="3"/>', '<path d="M0-25 9-11H-9Z"/>', '<path d="m0-25 9 5v10L0-5l-9-5v-10Z"/>', '<path d="M0-25 10-19 7-9H-7L-10-19Z"/>', '<path d="m0-26 3 6 7 1-5 5 2 7-7-4-7 4 2-7-5-5 7-1Z"/>'][index % 6];
  return `<g style="--pawn-color:${color}" class="online-board-pawn"><ellipse cy="10" rx="11" ry="3" class="pawn-shadow"/><path d="M-10 2v3c0 3 4 5 10 5s10-2 10-5V2c0 3-4 5-10 5s-10-2-10-5Z" class="pawn-base-side"/><path d="M-10 2c0-2 4-4 10-4s10 2 10 4-4 4-10 4-10-2-10-4Z" class="pawn-base-top"/><path d="M-5 2c2-3 3-6 3-9v-6h4v6c0 3 2 6 5 9-2 3-10 3-12 0Z" class="pawn-stem"/><g class="pawn-head pawn-head-form-${index}">${head}</g></g>`;
}

function raceBoardMarkup(snapshot, colors, esc) {
  const state = snapshot.gameState || {};
  if (!globalThis.RaceMode?.boardScene || !state.race) return '<div class="online-board-unavailable">Carregando tabuleiro…</div>';
  const game = {
    ...state,
    players: (snapshot.players || []).map((player) => ({ ...player, color: colors[player.colorIndex] || colors[0] })),
  };
  return globalThis.RaceMode.boardScene(game, {
    renderBoardPawn: pawn,
    playerColors: colors,
    esc,
  });
}

function cooperativeBoardMarkup(snapshot, colors, esc) {
  const state = snapshot.gameState || {};
  const coop = state.coop || {};
  const themePositions = [3, 6, 9, 12, 15];
  const route = ROUTE.map(([x,y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  const themes = THEMES.map((theme, index) => {
    const integrity = Math.max(0, Math.min(100, Number(coop.servers?.[theme.id]) ?? 100));
    const x = [180, 350, 520, 690, 850][index];
    const y = index < 3 ? 130 : 520;
    return `<g class="online-map-server" transform="translate(${x} ${y})"><rect x="-48" y="-31" width="96" height="58" rx="9"/><path d="M-31-12h62m-62 11h62m-62 11h40"/><circle cx="31" cy="10" r="4" fill="${theme.color}"/><text y="43">${esc(theme.label)} · ${integrity}%</text><rect class="online-map-health-bg" x="-38" y="31" width="76" height="4" rx="2"/><rect class="online-map-health" x="-38" y="31" width="${76 * integrity / 100}" height="4" rx="2" style="--server-color:${theme.color}"/></g>`;
  }).join('');
  const nodes = ROUTE.map(([x,y], index) => {
    const theme = themePositions.indexOf(index);
    const label = index === 18 ? 'FIM' : theme >= 0 ? THEMES[theme].label.slice(0,1) : String(index + 1);
    return `<g class="online-map-tile ${theme >= 0 ? `is-checkpoint theme-${THEMES[theme].id}` : ''} ${index === Number(coop.position || 0) ? 'is-current' : ''}" transform="translate(${x} ${y})"><ellipse cy="9" rx="24" ry="9"/><path d="M-24 0 0-13 24 0 0 14Z"/><text y="4">${label}</text></g>`;
  }).join('');
  const players = (snapshot.players || []).filter((player) => !player.isBot);
  const tokens = players.map((player, index) => {
    const position = ROUTE[Math.min(18, Math.max(0, Number(coop.position) || 0))];
    const group = players.filter((entry) => entry.playerId === player.playerId).length;
    const dx = (index % 3 - 1) * (group > 1 ? 15 : 0);
    const color = colors[player.colorIndex] || colors[index % colors.length];
    return `<g transform="translate(${position[0] + dx} ${position[1] - 11 - Math.floor(index / 3) * 18})" style="--pawn-color:${color}"><title>${esc(player.name)}</title>${pawn(index, color)}</g>`;
  }).join('');
  const hackHp = Math.max(0, Number(coop.hackerHp) || 0);
  return `<div class="isometric-scene online-coop-scene" role="img" aria-label="Mapa cooperativo da Cyber Rota com rota, servidores e Hacker"><svg class="board-svg online-coop-map" viewBox="0 0 1000 610" aria-hidden="true"><defs><linearGradient id="online-map-ground" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#194a4a"/><stop offset="1" stop-color="#102a35"/></linearGradient></defs><path class="online-map-platform" d="M500 45 940 260 940 360 500 570 60 360 60 260Z"/><path class="online-map-path-glow" d="${route}"/><path class="online-map-path" d="${route}"/>${nodes}${themes}<g class="online-map-hacker" transform="translate(908 290)"><circle r="42"/><path d="M-25 16v-17a25 25 0 0 1 50 0v17l-9-8-8 9-8-9-8 9-8-9Z"/><text y="59">HACKER · ${hackHp} PV</text></g>${tokens}</svg></div>`;
}

function onlineBoardMarkup(snapshot, colors, esc) {
  return snapshot.mode === 'competitive'
    ? raceBoardMarkup(snapshot, colors, esc)
    : cooperativeBoardMarkup(snapshot, colors, esc);
}

export { onlineBoardMarkup, cooperativeBoardMarkup, raceBoardMarkup };
