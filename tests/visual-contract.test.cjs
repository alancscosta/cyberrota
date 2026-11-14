const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/play-redesign.css'), 'utf8');
const hackerCss = fs.readFileSync(path.join(root, 'dist/hacker-visual.css'), 'utf8');
const finishCss = fs.readFileSync(path.join(root, 'dist/cyberrota-finish.css'), 'utf8');
const raceMode = fs.readFileSync(path.join(root, 'dist/race-mode.js'), 'utf8');
const boardCss = fs.readFileSync(path.join(root, 'dist/board.css'), 'utf8');

test('the interface bundles IBM Plex Sans locally and overrides legacy font rules', () => {
  assert.ok(hackerCss.includes('font-family: "IBM Plex Sans"'), 'the interface selects IBM Plex Sans');
  assert.ok(hackerCss.includes('IBMPlexSans-latin.woff2'), 'the font is served from the project');
  assert.ok(hackerCss.includes('body.in-game .hacker-head h3'), 'the Hacker panel overrides its legacy Inter rule');
  assert.ok(hackerCss.includes('font-size: 17px'), 'answer text has a readable size');
  assert.ok(hackerCss.includes('game-control-dock h2'), 'game question and phase headings receive larger type');
  assert.ok(fs.existsSync(path.join(root, 'dist/assets/IBMPlexSans-latin.woff2')));
});

test('the browser tab uses the brand name and the SVG symbol as its favicon', () => {
  assert.match(html, /<title>Cyber Rota<\/title>/);
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="assets\/cyberrota-symbol\.svg">/);
  assert.ok(fs.existsSync(path.join(root, 'dist/assets/cyberrota-symbol.svg')));
});

test('the brand mark is copied into the production assets used by the game header', () => {
  assert.match(app, /src="assets\/cyberrota-logo\.svg"/);
  assert.match(html, /src="assets\/cyberrota-logo\.svg"/);
  assert.ok(fs.existsSync(path.join(root, 'dist/public/assets/cyberrota-logo.svg')), 'Vite copies the runtime logo into the build output');
});

test('the Hacker stays on the centerline of the external relay', () => {
  assert.match(hackerCss, /datacenter-scene \.boss-model\s*\{[^}]*transform-origin:\s*0 0;[^}]*translate:\s*none !important;[^}]*scale:\s*none !important;/s);
  assert.ok(app.includes('class="defense-hub" transform="translate(500 322)"'), 'the defense hub remains centered and clear of the route');
  assert.ok(app.includes('class="boss-model boss-scene-figure'), 'the external Hacker uses the centered SVG mount');
  assert.ok(!app.includes('M500 409V488'), 'the hub cable does not cross the starting space');
});

test('a player hit renders short lived smoke and flame after the blast', () => {
  assert.ok(app.includes('class="boss-aftermath"'), 'after-effects are part of the rendered Hacker hit');
  assert.ok(app.includes("bossHit?'<g class=\"boss-aftermath\""), 'after-effects only exist during an actual hit');
  assert.ok(hackerCss.includes('hacker-smoke-rise 1.45s ease-out .78s both'));
  assert.ok(hackerCss.includes('hacker-fire-fade 1.2s ease-out .55s both'));
});

test('Hacker damage accumulates persistent smoke, fire, and structural cracks', () => {
  assert.ok(app.includes('bossDamageCount>=1?renderBossDamageFX(bossDamageCount):\'\''), 'the damaged state is derived from cumulative hits');
  assert.ok(app.includes('function renderBossDamageFX(count)'), 'persistent damage effects have a dedicated renderer');
  assert.ok(app.includes('damage-level-${level}') && app.includes('level>=2?'), 'smoke persists after the first hit and fire unlocks on a later damage stage');
  assert.ok(hackerCss.includes('.boss-damage-smoke .smoke-wisp'), 'smoke remains attached to the damaged robot');
  assert.ok(hackerCss.includes('.boss-damage-fire .damage-flame'), 'fire keeps burning on the damaged robot');
  assert.ok(hackerCss.includes('.boss-structural-crack'), 'the chassis gains persistent visible fractures');
});

test('each armor stage renders its fragments in front of the Hacker until they land', () => {
  const robot = app.indexOf('${renderBossModel()}');
  const fragments = app.indexOf('${renderArmorDebris(bossDefeated?5:armorStage');
  assert.ok(robot >= 0 && fragments > robot, 'detached armor is layered in front of the robot instead of being hidden behind it');
  assert.ok(app.includes("group:1,name:'back-left'") && app.includes("group:2,name:'antenna-left'") && app.includes("group:3,name:'shoulder-left'") && app.includes("group:4,name:'forearm-left'") && app.includes("group:5,name:'chest'"), 'five distinct hits detach armor in visible stages');
  assert.ok(hackerCss.includes('.armor-debris-part.landed'), 'fallen armor remains visible on the relay deck after its animation');
  assert.ok(app.includes('class="armor-fragment" style="--fall-offset-x:${-part.x}px;--fall-offset-y:${-part.y}px;--fall-angle-reverse:${-part.angle}deg;--fall-angle-soft:${-part.angle*.14}deg"'), 'the fragment animates inside its positioned SVG wrapper');
  assert.ok(hackerCss.includes('.armor-debris-part.drop-now .armor-fragment { animation: armor-fragment-drop'), 'the fragment moves from the Hacker body to its landing position');
  assert.ok(!hackerCss.includes('.armor-debris-part.drop-now { animation: armor-fall-from-body'), 'the animation never overrides the wrapper transform that places it on the board');
});

test('the co-op board shows every player token and a persistent turn roster', () => {
  assert.ok(app.includes('function renderCoopPlayerRoster()'), 'the full team has a dedicated always-visible roster');
  assert.ok(app.includes("class=\"coop-player-chip '+(index===game.coop.currentPlayer?'is-current':'')+'\""), 'the active player is highlighted among all names');
  assert.ok(app.includes('renderBoardPawnAvatar(avatarIndex,color)'), 'the roster uses the same selected pawn avatar shown on the board');
  assert.ok(app.includes('class="turn-token turn-player-avatar"'), 'the current-player banner shows that player’s selected pawn avatar');
  assert.ok(app.includes("class=\"coop-player-token '+(active?'is-current':'')+'\""), 'all six players are individually represented on the shared route pawn');
  assert.ok(app.includes('playerMotion=pawnMotionValues.length>1?') && app.includes('hopY') && app.includes('calcMode=\"spline\"'), 'the team hops through each intermediate platform on a correct roll');
  assert.ok(app.includes('moveAnimationPlayed'), 'a rerender cannot replay the movement that already finished this turn');
  assert.ok(app.includes('game.coop.players.map((player,index)=>'), 'the roster and board tokens derive from the full room roster');
});

test('the defense board gives every rack clear road clearance and widens the pawn platform', () => {
  const rackConfig = app.match(/const rackPositions=({[^;]+});/)?.[1];
  assert.ok(rackConfig, 'rack layout is explicit so its clearance can be reviewed');
  const rackPositions = Object.fromEntries([...rackConfig.matchAll(/(\w+):\[(\d+),(\d+)\]/g)].map((match) => [match[1], [Number(match[2]), Number(match[3])]]));
  const route = JSON.parse(app.match(/const coopPath=(\[\[[^;]+\]\]);/)?.[1] || '[]');
  const routeHalfX = 27 * 1.3;
  const routeTop = 17 * 1.3;
  const routeBottom = 28 * 1.3;
  const rackScale = 0.54;
  const rackBounds = Object.entries(rackPositions).map(([name, [x, y]]) => ({ name, left: x - 17 * rackScale, right: x + 103 * rackScale, top: y - 5 * rackScale, bottom: y + 190 * rackScale }));
  for (const rack of rackBounds) {
    for (const [x,y] of route) {
      const overlaps = rack.left < x + routeHalfX && rack.right > x - routeHalfX && rack.top < y + routeBottom && rack.bottom > y - routeTop;
      assert.equal(overlaps, false, `${rack.name} rack stays clear of the platform at ${x},${y}`);
    }
  }
  for (let i=0;i<rackBounds.length;i++) for (let j=i+1;j<rackBounds.length;j++) {
    const a=rackBounds[i],b=rackBounds[j];
    assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top, `${a.name} and ${b.name} racks do not overlap`);
  }
  const tileVertices=[[-27,0],[-23,-4],[-2,-16],[2,-16],[23,-4],[27,7],[27,13],[2,27],[0,28],[-2,27],[-27,13]];
  for(const [x,y] of route) for(const [dx,dy] of tileVertices){const edge=(Math.abs(x+dx*1.3-500)/440)+(Math.abs(y+dy*1.3-280)/238);assert.ok(edge<=1,`route platform at ${x},${y} stays inside the board`);}
  const tilePolygon=[[-27,0],[-23,-4],[-2,-16],[2,-16],[23,-4],[27,2],[27,13],[2,27],[0,28],[-2,27],[-27,13]].map(([x,y])=>[x*1.3,y*1.3]);
  const project=(polygon,[ax,ay])=>{const values=polygon.map(([x,y])=>x*ax+y*ay);return [Math.min(...values),Math.max(...values)];};
  const intersects=(first,second)=>{const a=tilePolygon.map(([x,y])=>[x+route[first][0],y+route[first][1]]),b=tilePolygon.map(([x,y])=>[x+route[second][0],y+route[second][1]]);for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],length=Math.hypot(q[0]-p[0],q[1]-p[1]),axis=[-(q[1]-p[1])/length,(q[0]-p[0])/length],ap=project(a,axis),bp=project(b,axis);if(ap[1]<=bp[0]||bp[1]<=ap[0])return false;}return true;};
  for(let first=0;first<route.length;first++)for(let second=first+1;second<route.length;second++)assert.equal(intersects(first,second),false,`platforms ${first+1} and ${second+1} do not overlap`);
  for (const rack of rackBounds) { const overlapsHub=rack.left<575&&rack.right>425&&rack.top<410&&rack.bottom>215; assert.equal(overlapsHub,false,`${rack.name} rack stays clear of the defense hub`); for(const [x,y] of [[rack.left,rack.top],[rack.right,rack.top],[rack.left,rack.bottom],[rack.right,rack.bottom]]) assert.ok(Math.abs(x-500)/440+Math.abs(y-280)/238<.94,`${rack.name} rack stays inside the board`); }
  assert.ok(app.includes("transform=\"translate('+x+' '+y+') scale(1.3)\""), 'route platforms are widened to fit the compact team formation');
  assert.ok(app.includes('scale(.54)'), 'server buildings are large enough to read clearly inside the bays');
});

test('the hub stack is separated, pawns bob in formation, and the Hacker signals an attack', () => {
  assert.ok(app.includes('class="hub-floating-cap" transform="translate(0 -28)"'), 'the upper landing sits above its supports');
  assert.ok(app.includes('class="hub-totem" transform="translate(0 -70)"'), 'the hex beacon is seated above the cap without cutting through it');
  assert.ok(app.includes('class="hub-top"'), 'the hub has a clearly visible upper landing face');
  assert.ok(app.includes('class="hacker-binary-attack"'), 'red binary streams appear behind the Hacker during an attack');
  assert.ok(app.includes('class="hacker-scream"'), 'the attack adds a visible scream cue around the Hacker');
  assert.ok(app.includes("playSfx('hacker-scream')"), 'the Hacker has a synthesized scream sound');
  assert.ok(hackerCss.includes('hacker-binary-fall'), 'binary streams animate during an attack');
  assert.ok(hackerCss.includes('pawn-token-bob'), 'each participant pawn gets a subtle idle animation');
  assert.ok(hackerCss.includes('prefers-reduced-motion: reduce'), 'reduced-motion settings disable decorative motion');
});

test('board participants look like broad game pawns, not stretched robot sprites', () => {
  assert.ok(app.includes('function renderBoardPawn(index,color)'), 'board tokens use a dedicated pawn illustration');
  assert.ok(app.includes('pawnOffsets=[[-18,-4],[0,-4],[18,-4],[-18,15],[0,15],[18,15]]'), 'six pawns occupy two separated rows on the start tile');
  assert.ok(app.includes('renderBoardPawn(avatarIndex,color)'), 'every color receives a pawn-shaped figure');
  assert.ok(app.includes('<g class=\"coop-mini-robot\"><g transform=\"scale(.82)\">'), 'the six pieces shrink together to fit within one route platform');
  assert.ok(app.includes('pawn-head-form-') && app.includes('pawn-base-top'), 'pawn heads have six silhouettes and share a wide stable base');
});

test('the die only colors real pips and shows standard one-through-six faces', () => {
  assert.ok(hackerCss.includes('.dice-tray-active .dice-pips i.pip'), 'turn color applies only to occupied pip cells');
  assert.ok(!hackerCss.includes('.dice-tray-active .dice-pips i {'), 'empty pip cells remain blank');
  for (const face of ['renderDiePips(1)', 'renderDiePips(2)', 'renderDiePips(3)', 'renderDiePips(4)', 'renderDiePips(5)', 'renderDiePips(6)']) assert.ok(app.includes(face), `the cube has a standard ${face.slice(-2,-1)} face`);
});

test('each player chooses a unique color and sees the matching pawn before joining', () => {
  assert.ok(app.includes('const PLAYER_COLOR_LABELS = ['), 'the six player colors have visible names');
  assert.ok(app.includes('renderBoardPawnAvatar(colorIndex,color)'), 'color selection uses the same pawn art as the board');
  assert.ok(app.includes("data-color-index=\"'+colorIndex+'\""), 'color choices expose their palette index to the setup form');
  assert.ok(app.includes('takenByOther=selectedColors.some((value,other)=>other!==index&&value===colorIndex)'), 'a color used by another player is disabled');
  assert.ok(app.includes('new Set(selectedColorIndexes).size!==names.length'), 'starting a game rejects duplicate colors even if form state is tampered');
  assert.ok(app.includes('color:PLAYER_COLORS[selectedColorIndexes[index]]'), 'the selected color follows each player into the game state');
  assert.ok(app.includes("player.color||playerColors[index%playerColors.length]"), 'the selected color drives in-game player avatars and tokens');
});

test('the 3v3 race shows both teams and a purpose-built server-disconnect board', () => {
  assert.ok(app.includes('RaceMode.render(game,'), 'the server-disconnect screen is a dedicated, testable renderer');
  assert.ok(raceMode.includes('race-team-roster') && raceMode.includes('aria-label="Jogadores da equipe'), 'both team score cards list all three participants');
  assert.ok(raceMode.includes('renderBoardPawnAvatar') && raceMode.includes('CASA ${localPosition}'), 'the score strip shows each player pawn, name, and individual house');
  assert.ok(raceMode.includes('function boardScene(game, ui)'), '3v3 uses a dedicated board scene');
  assert.ok(raceMode.includes('viewBox="0 0 800 800"') && raceMode.includes('race-board-base'), 'the redesigned route fits a square playing surface');
  assert.ok(raceMode.includes('race-server-stand') && raceMode.includes('server-cable') && raceMode.includes('server-socket'), 'both team stands show a wired server and outlet');
  assert.ok(raceMode.includes('server-powering-down') && raceMode.includes('stand-beacon'), 'server lights and the stand beacon animate off after the trio arrives');
  assert.ok(raceMode.includes('occupants = roster.filter((piece) => piece.position === position)') && raceMode.includes('point[1] - 12 + offsetY'), 'pawns share centered, evenly spaced layouts on their current route tile');
  assert.ok(app.includes('globalThis.RaceMode.boardScene(game,'), 'the main game renderer uses the dedicated 3v3 board');
});

test('server-disconnect game shows its die on the main board and explains movement', () => {
  assert.ok(raceMode.includes('data-action="race-roll"') && raceMode.includes('Rolar dado · 1–6'), 'the active player rolls before seeing the question');
  assert.ok(html.includes('type="module" src="race-mode.js?v=') && raceMode.includes('ui.renderRaceDiceTray(game.raceRoll, activeColor'), 'the selected die face appears on the main stage');
  assert.ok(raceMode.includes('ui.renderRaceDiceTray(game.raceRoll, activeColor, Boolean(game.diceAnimating))'), 'the 3v3 calls the shared style of dice tray and animates online rolls');
  assert.ok(app.includes('function renderRaceDiceTray(value,color,rolling=false)') && app.includes('race-dice-tray'), 'the 3v3 die uses the same 3D cube and tray structure as other modes');
  assert.ok(boardCss.includes('.race-world-stage .race-dice-tray{z-index:8}'), 'the 3v3 die is anchored in the gameplay stage');
  assert.ok(raceMode.includes('Acerto avança o dado') && raceMode.includes('Erro recua seu peão'), 'the instructions explain the movement rule in the game UI');
  assert.ok(raceMode.includes('EQUIPE COMPLETA NO ESTANDE'), 'the turn result calls out the whole team arriving');
  assert.ok(raceMode.includes('event.opponentPosition ?? race.teams[event.team'), 'a miss displays the opposing pawn’s actual house number');
  assert.ok(raceMode.includes('EQUIPE ${game.race.outcome') && raceMode.includes('GANHADORA'), 'the winning team appears in a large centered overlay');
  assert.ok(raceMode.includes("const winnerTone = game.race.outcome === 'blue-win' ? 'blue' : 'red'") && raceMode.includes('race-victory-overlay team-${winnerTone}'), 'the victory overlay identifies the winning team for color styling');
  assert.ok(boardCss.includes('.race-victory-overlay') && boardCss.includes('race-victory-title'), 'the winning overlay fades in and out over the match');
  assert.ok(boardCss.includes('.race-victory-overlay.team-blue .race-victory-content strong') && boardCss.includes('.race-result-card.team-blue h2') && boardCss.includes('color:#43d6ff'), 'all Blue victory headlines use the blue team color');
  assert.ok(boardCss.includes('.race-victory-overlay.team-red .race-victory-content strong') && boardCss.includes('.race-result-card.team-red h2') && boardCss.includes('color:#ff7188'), 'all Red victory headlines use the red team color');
  assert.ok(hackerCss.includes('body.in-game .dice-tray-active .dice-pips i.pip { background: var(--turn-color'), 'the die face stays in the game palette while current-player pips change color');
  assert.ok(finishCss.includes('race-result-card:not(.damage) .race-damage') && finishCss.includes('color:#b7f0d1'), 'a correct move uses a green, readable result label');
  assert.ok(finishCss.includes('race-result-card.damage .race-damage') && finishCss.includes('color:#ffc2c5'), 'a failed move uses a separate red result label');
  assert.ok(app.includes('Core.resolveRaceTurn(game.race,{correct,roll:game.raceRoll})'), 'answer results update individual peons through the tested game rules');
  assert.ok(app.includes('restored.mode===\'competitive\'&&restored.race') && app.includes('race.teams.blue.positions=Array(3)'), 'saved games from the former team-race rules migrate without a blank screen');
});

test('a completed 3v3 route renders only the rival server powering down and the winner overlay', () => {
  const context = { GameCore: require('../dist/game-core.js') };
  vm.runInNewContext(raceMode, context);
  const colors = ['#43d6ff', '#769bff', '#ffbd68', '#d49bff', '#72e0b3', '#ff8e9b'];
  const game = {
    mode: 'competitive', phase: 'race-shutdown', raceRoll: 5, raceVictoryStartedAt: Date.now(),
    race: { ...context.GameCore.newRaceState(['A1', 'A2', 'A3'], ['V1', 'V2', 'V3']), teams: { blue: { players: ['A1', 'A2', 'A3'], positions: [18, 18, 18] }, red: { players: ['V1', 'V2', 'V3'], positions: [18, 18, 18] } }, outcome: 'blue-win', turn: 6, maxTurns: 60 },
    players: [...['A1', 'A2', 'A3', 'V1', 'V2', 'V3']].map((name, index) => ({ name, color: colors[index] })),
  };
  const ui = {
    playerColors: colors, soundMuted: true, renderBoardPawnAvatar: () => '<svg/>', renderBoardPawn: () => '<g/>',
    renderDiePips: () => '<span class="dice-pips"><i class="pip"/></span>', renderQuestion: () => '',
    renderRaceDiceTray: () => '<div class="dice-tray race-dice-tray"/>',
    renderBoardScene: () => context.RaceMode.boardScene(game, ui), initials: (name) => name.slice(0, 1), esc: (value) => String(value),
    uiIcon: () => '',
  };
  const html = context.RaceMode.render(game, ui);
  assert.match(html, /SERVIDOR DESCONECTADO/);
  assert.match(html, /race-victory-overlay team-blue/);
  assert.match(html, /EQUIPE AZUL<br>GANHADORA/);
  assert.equal((html.match(/server-powering-down/g) || []).length, 1, 'only the opposing red server powers down');
  assert.equal((html.match(/class="race-board-pawn/g) || []).length, 6, 'all six players remain visible on the board through the shutdown animation');
  assert.match(html, /SERVIDOR VERMELHO/);
  assert.match(html, /SERVIDOR AZUL/);
  game.race.outcome = 'red-win';
  const redHtml = context.RaceMode.render(game, ui);
  assert.match(redHtml, /race-victory-overlay team-red/);
  assert.match(redHtml, /EQUIPE VERMELHA<br>GANHADORA/);
  game.phase = 'finished';
  const redResultHtml = context.RaceMode.render(game, ui);
  assert.match(redResultHtml, /race-result-card team-red/);
});

test('the blue socket clears the first front slot and both servers share the same rack silhouette', () => {
  assert.ok(raceMode.includes("team === 'blue' ? { x: -48, y: 124"), 'blue outlet and cable are on the rack’s left side, away from the first slot');
  assert.ok(!raceMode.includes('rack-door-open-right') && !raceMode.includes('rack-door-panel'), 'the red server has no protruding door that differs from the blue rack');
  assert.ok(raceMode.includes("const labelX = team === 'red' ? -36 : 0"), 'the red server label stays clear of its power socket');
});

test('co-op player avatars have six silhouettes and appear in the roster and on the pawn', () => {
  assert.ok(app.includes('function renderBoardPawn(index,color)'), 'the six participant colors map to distinct board-piece silhouettes');
  assert.ok(app.includes('renderBoardPawnAvatar(index,color)'), 'the piece portrait uses the selected color');
  assert.ok(app.includes("renderBoardPawnAvatar(avatarIndex,color)+'</span><span>'+esc(player.name)"), 'each roster entry displays its matching piece portrait');
  assert.ok(!app.includes('PLAYER_AVATAR_SHAPES') && !app.includes('renderPlayerPiece('), 'unused legacy robot art has been removed');
  assert.ok(app.includes('renderBoardPawn(avatarIndex,color)'), 'the board pawns reuse the distinct piece silhouettes');
  assert.ok(app.includes('class=\"pawn-base-top\"') && app.includes('rx=\"12\" ry=\"3\"'), 'the six board figures use a broad, stable tabletop base');
  assert.ok(hackerCss.includes('.board-pawn-avatar .pawn-head { fill: var(--pawn-color)'), 'roster and turn avatars retain the exact token color outside the board SVG');
  assert.ok(hackerCss.includes('.board-pawn-avatar .pawn-base-top { fill: var(--pawn-color)'), 'roster and turn avatars retain their colored base');
});

test('the defense route stays clear of server bays and the defense hub', () => {
  assert.ok(app.includes('fisica:[365,275],rede:[365,160],transporte:[585,275],aplicacao:[290,245],seguranca:[660,245]'), 'server racks sit in interior bays away from route tiles');
  assert.ok(!app.includes('M500 409V488'), 'no hub cable crosses the route or start tile');
});

test('turn and victory notices are large centered overlays over the gameplay', () => {
  assert.ok(hackerCss.includes('body.in-game .coop-turn-card .turn-announcement { position: fixed;'), 'turn announcement overlays the middle of gameplay');
  assert.ok(hackerCss.includes('font: 900 clamp(36px,7vw,78px)'), 'turn announcement is readable at a glance');
  assert.ok(boardCss.includes('race-victory-overlay{position:fixed;inset:0') && boardCss.includes('.race-victory-content strong{font:900 clamp(48px,10vw,124px)'), 'victory is presented full-screen with a large centered title');
});

test('restored co-op saves derive armor damage stages from their recorded hits', () => {
  assert.ok(app.includes("restored.coop.armorStage=Math.max(Number(restored.coop.armorStage)||0,restored.coop.log.filter((event)=>event.outcome==='correct').length)"), 'older saved games restore missing armor stages from the combat log');
  assert.ok(html.includes('game-core.js?v=18'), 'the browser reloads the current damage, turn skip, victory, and race movement logic');
});

test('damage visor uses two separated eye slits rather than a connecting line', () => {
  assert.ok(app.includes('<path class="boss-eye" d="M-14-30v7m28-7v7"'), 'the eyes are two separate vertical slits');
  assert.ok(app.includes('class="evil-brow"'), 'the visor has inward slanted villain brows');
  assert.ok(app.includes('class="boss-scowl"'), 'the mouth reads as a scowl');
  assert.ok(hackerCss.includes('stop-color: #100e17'), 'the armor uses a dark hostile palette');
  assert.ok(hackerCss.includes('path[fill="#12314f"] { fill: #24101a'), 'hard-coded blue body panels are recolored');
  assert.ok(hackerCss.includes('.armor-back path:not([fill="none"]) { fill: #341420'), 'legacy blue armor plates are recolored too');
  assert.ok(hackerCss.includes('circle[fill="#102640"] { fill: #241018'), 'legacy blue joints are recolored too');
  assert.ok(hackerCss.includes('.armor-back path[fill="none"] { fill: none !important'), 'back armor highlights cannot become blue filled plates');
  assert.ok(hackerCss.includes('.armor-antenna circle { fill: #bd2443'), 'both antenna lights use the hostile red palette');
  assert.ok(hackerCss.includes('.boss-external-perch circle { fill: #ff5269'), 'the Hacker platform signal matches its red palette');
});

test('broken armor returns from its landed position when the Hacker heals', () => {
  assert.ok(app.includes("type:'repair'"), 'Challenge healing records a repair transition');
  assert.ok(app.includes('class="armor-debris-part ${part.name} ${state}"'), 'the same armor fragments are reused');
  assert.ok(hackerCss.includes('armor-return-to-body'), 'the fragments animate back to their body sockets');
});

test('the five sector checkpoints retain their own palette accents', () => {
  for (const theme of ['fisica', 'rede', 'transporte', 'aplicacao', 'seguranca']) {
    assert.match(css, new RegExp(`coop-route-tile\\.tile-${theme} \\.route-tile-face`));
    assert.match(css, new RegExp(`datacenter-rack\\.theme-${theme}`));
  }
});

test('the Defense board keeps a clear square footprint, classic traces, and aligned base', () => {
  assert.ok(app.includes('fisica:[365,275],rede:[365,160],transporte:[585,275],aplicacao:[290,245],seguranca:[660,245]'), 'all racks sit in separated interior bays away from the route and base');
  assert.ok(app.includes('const coopPath=[[128,280],[183,310],[240,340],[305,370],[370,400],[435,430],[500,470],[565,430],[630,400],[695,370],[760,340],[817,310],[872,280],[825,245],[760,220],[695,190],[630,160],[575,125],[500,128]];'), 'the 19 walkable spaces follow the board perimeter with room for their larger platforms');
  const route = JSON.parse(app.match(/const coopPath=(\[\[[^;]+\]\]);/)?.[1] || '[]');
  assert.equal(route.length, 19, 'the route contains 19 distinct walkable spaces');
  for (const [x,y] of route) assert.ok(Math.abs(x-500)/440 + Math.abs(y-280)/238 <= 1, `platform at ${x},${y} stays inside the board`);
  assert.equal((app.match(/d="M\$\{coopPathD\}"/g) || []).length, 2, 'the road edge and dashes use the same route points');
  assert.ok(app.includes('M500 42 940 280 500 518 60 280Z'), 'the isometric square keeps a clear gap below the external robot platform');
  assert.ok(app.includes('M500 75 850 280 500 485 150 280Z') && app.includes('M500 108 786 280 500 451 214 280Z'), 'the earlier subtle circuit traces are restored');
  assert.ok(app.includes('class="defense-hub" transform="translate(500 322)"'), 'the base remains centered away from the road');
  assert.ok(app.includes('class="hub-floating-cap" transform="translate(0 -28)"'), 'the base cap floats clearly above the support walls');
  assert.ok(app.includes('class="hub-totem" transform="translate(0 -70)"'), 'the defense totem sits above the cap without cutting through it');
  assert.ok(!app.includes('M500 409V488'), 'no centered link overlays the route tiles');
  assert.ok(app.includes('class="hub-lift-beams"'), 'light beams make the floating base cap visibly separate from its foundation');
});

test('the Solo route follows the board perimeter without overlapping platforms', () => {
  const route = JSON.parse(app.match(/const coords=(\[\[[^;]+\]\]);/)?.[1] || '[]');
  assert.equal(route.length, 19, 'the Solo route keeps all 19 positions');
  for (const [x, y] of route) assert.ok(Math.abs(x-500)/440 + Math.abs(y-280)/238 <= .96, `Solo platform at ${x},${y} stays within the board margin`);
  for (let first=0; first<route.length; first++) for (let second=first+2; second<route.length; second++) {
    const distance=Math.hypot(route[first][0]-route[second][0],route[first][1]-route[second][1]);
    assert.ok(distance>=62, `Solo platforms ${first} and ${second} do not collide`);
  }
  assert.ok(app.includes('const checkpointByPosition=Object.fromEntries(Core.CHECKPOINTS.map((pos,index)=>[pos,Core.THEMES[index]]))'), 'the route keeps its thematic checkpoints');
  assert.ok(route[18][0] < route[17][0] && route[18][1] > route[17][1], 'the route approaches its exit terminal along the perimeter');
  assert.ok(app.includes('function renderSoloGateway()') && app.includes('Gateway de saída para a Internet') && app.includes('INTERNET'), 'the destination is a recognizable gateway attached to the route');
  assert.ok(app.includes("coop?'CENTRAL DE DEFESA':'INTERNET · GATEWAY'"), 'the Solo arrival label names the network exit');
  assert.ok(app.includes('function renderSoloTopology()') && app.includes('solo-topology'), 'the center reads as a connected network without a freestanding pedestal');
  assert.ok(!app.includes('renderSoloNexus') && !app.includes('destination-crown'), 'the isolated hub and floating crown are removed');
  assert.ok(app.includes('transform="translate(${x-29} ${y})"'), 'each Solo platform is centered on the route coordinate shared by the pawn and road');
  assert.ok(boardCss.includes('body.in-game .board-svg.board-solo .board-top{fill:#10283c'), 'the Solo map shares the site navy and cyan palette');
  assert.ok(finishCss.includes('body.in-game .game-control-dock .route-console{') && finishCss.includes('background:linear-gradient(145deg,#122a3e,#0e2234)'), 'Solo turn notices use the game palette instead of a white paper panel');
  assert.ok(finishCss.includes('body .alert-box { color: #c5dceb; background: #10263b;'), 'warnings use the dark navy and cyan interface palette');
});

test('the Solo pawn keeps a visible palette color and hops across every space it moves', () => {
  assert.ok(app.includes('safeColor=PLAYER_COLORS.includes(player.color)?player.color:PLAYER_COLORS[offset%PLAYER_COLORS.length]'), 'old or invalid saved colors fall back to a visible player color');
  assert.ok(app.includes('game.playerMove={from:previousPosition,to:player.position,startedAt:Date.now()}'), 'a route roll remembers the spaces the pawn must travel');
  assert.ok(app.includes('motionValues=[];if(isMoving){'), 'the solo pawn builds a path through each intermediate house');
  assert.ok(app.includes("class=\"player-pawn solo '+(isMoving?'is-moving':''"), 'the moving piece uses its own animation class');
  assert.ok(app.includes('calcMode="spline" fill="freeze"'), 'the pawn follows the same eased hop animation as the co-op pieces');
  assert.ok(boardCss.includes('.player-pawn.is-moving{'), 'Solo hops are visibly styled on each route space');
  assert.ok(hackerCss.includes('body.in-game .board-solo .player-pawn .pawn-base-top { fill: var(--pawn-color);'), 'the Solo pawn paints its base, body, and head with the selected color');
  assert.ok(app.includes('localX=offset===0?0:((offset%3)-1)*17,localY=offset===0?0:offset>2?-9:8'), 'a solo pawn is centered over its platform rather than using a team formation offset');
  assert.ok(app.includes('<g transform="scale(1.2)"><ellipse cy="19"') && app.includes('renderBoardPawn(avatarIndex,safeColor)'), 'only the pawn illustration scales, not its route coordinate');
  assert.ok(boardCss.includes('.board-svg.board-solo .player-pawn{scale:1!important}'), 'the route coordinate group stays at the exact SVG house position');
});

test('turn prompts and dice use the active player color with readable light contrast', () => {
  assert.ok(app.includes('const PLAYER_COLORS = [') && app.includes('style="--turn-color:${turnColor}"'), 'the active player color is shared with the die');
  assert.ok(app.includes('class="turn-announcement"') && app.includes('SUA VEZ!!!'), 'the current player gets a clear turn announcement');
  assert.ok(hackerCss.includes('.dice-face') && hackerCss.includes('background:linear-gradient(145deg,#173b59,#0c2237)') && hackerCss.includes('color:#dff7ff'), 'the colored die uses a dark game-palette face with readable pips');
  assert.ok(hackerCss.includes('turn-announcement-fade'), 'the turn prompt fades in and out');
});

test('turns use one 20-second clock with a warning in the final five seconds', () => {
  assert.ok(app.includes('const TURN_WARNING_SECONDS=5') && app.includes('const TURN_SECONDS=20'), 'turn timing allows twenty seconds and warns at five');
  assert.ok(app.includes('function startPlayerTurnClock') && app.includes('function expirePlayerTurn'), 'turn clock and timeout have dedicated handlers');
  assert.ok(app.includes('turn-warning-overlay') && app.includes('turn-warning-value'), 'the last five seconds appear over the active board');
  assert.ok(app.includes('PASSOU A VEZ') && app.includes('turnNotice'), 'all players can see who timed out');
  assert.ok(app.includes('VEZ DE') && app.includes('currentPlayerId===game.localPlayerId'), 'online clients see whose turn is active');
  const turnClock = app.slice(app.indexOf('function startPlayerTurnClock'), app.indexOf('function expirePlayerTurn'));
  const timeout = app.slice(app.indexOf('function expirePlayerTurn'), app.indexOf('function renderGame'));
  assert.ok(turnClock.includes("stage:'active',seconds:TURN_SECONDS,remaining:TURN_SECONDS,deadline:Date.now()+TURN_SECONDS*1000"), 'the twenty-second action window begins immediately');
  assert.doesNotMatch(turnClock, /resolveTimedAction|randomOptionIndex/, 'the clock never acts for the player');
  assert.doesNotMatch(timeout, /resolveTimedAction|randomOptionIndex/, 'an expired turn is passed without a random answer');
  assert.ok(!app.includes('function resetQuestionClock(') && !app.includes('resetQuestionClock()') && !app.includes('restartTurnActionClock('), 'intermediate actions cannot restart the clock');
  assert.ok(boardCss.includes('.turn-warning-overlay,.turn-notice-overlay{') && !boardCss.includes('backdrop-filter:blur(3px)'), 'turn warnings never blur the board');
  assert.ok(app.includes('Core.skipCoopTurn(game.coop)') && app.includes('Core.skipRaceTurn(game.race)'), 'timeouts pass co-op and 3v3 turns without combat effects');
});

test('larger route platforms and the victory message fade in and out', () => {
  assert.ok(app.includes('M-27 7 Q-27 4 -23 2'), 'route platforms have a larger visible footprint');
  assert.ok(hackerCss.includes('turn-announcement-fade'), 'the turn prompt fades in and out');
  assert.ok(hackerCss.includes('victory-message-fade'), 'the final victory message fades in and out');
});

test('the co-op victory reuses the 3v3 full-screen title after the Hacker explosion', () => {
  assert.ok(app.includes('function renderCoopVictory()'), 'co-op victory has a dedicated board-preserving scene');
  assert.ok(app.includes('const victoryNow=game.onlineRoom?onlineNow():Date.now();')&&app.includes('Core.coopVictoryStage(sequence.startedAt,victoryNow)'), 'the final message uses one synchronized timeline in online rooms and the local clock offline');
  assert.ok(app.includes("stage==='button'&&!game.room?'<button class=\"coop-victory-return\" data-action=\"finish-session\">Ir ao menu</button>':''"), 'the menu button only exists after the victory title fades out and stays hidden for online rooms');
  assert.ok(app.includes("victorySequence={stage:'explosion',startedAt:Date.now()}"), 'the explosion timing starts with the winning hit');
  assert.ok(app.includes('class="race-victory-overlay coop-victory-overlay"') && app.includes('VITÓRIA<br>DA EQUIPE'), 'the final win uses the 3v3 full-screen victory structure');
  assert.ok(app.includes("${bossDefeated?'boss-defeated ':''}"), 'the Hacker is hidden after the final explosion');
  assert.ok(app.includes('class="boss-final-explosion"'), 'the final blast is rendered on the Hacker');
  assert.ok(app.includes('class="boss-final-part ${part.name}"'), 'the final wreck uses recognizable robot assemblies');
  assert.ok(app.includes("name:'head'"), 'the head is one of the falling parts');
  assert.ok(app.includes("name:'torso'"), 'the torso is one of the falling parts');
  assert.ok(app.includes("name:'left-arm'"), 'the arms are separated into falling parts');
  assert.ok(app.includes("name:'left-leg'"), 'the legs are separated into falling parts');
  assert.ok(!app.includes('boss-rubble-part'), 'generic small cube shrapnel is not used for the boss');
  assert.ok(boardCss.includes('.coop-victory-overlay .race-victory-content strong') && boardCss.includes('animation:race-victory-title 3s'), 'the co-op message uses the shared 3v3 fade sequence while keeping its green success color');
  assert.ok(boardCss.includes('coop-victory-overlay .race-victory-content strong{color:#a2ffca'), 'co-op success keeps the green success color');
  assert.ok(boardCss.includes('.cooperative-victory .sequence-button .coop-victory-overlay .race-victory-content> :not(.coop-victory-return)'), 'after the fade only the delayed menu button remains visible');
  assert.ok(hackerCss.includes('animation: boss-final-fade .72s ease-out both !important'), 'the final destruction overrides legacy robot idle styles');
  assert.ok(hackerCss.includes('body.in-game .boss-model.boss-defeated { opacity: 0 !important; }'), 'reduced motion still leaves the final defeated pose');
  assert.ok(hackerCss.includes('boss-final-part-fall'), 'large robot parts fall and settle instead of bursting radially');
  assert.ok(finishCss.includes('animation-duration: 3.15s !important'), 'the final fall is slowed to remain visible before the win message');
});

test('the panel uses the game board and all six available SVG avatars as its hero art', () => {
  assert.ok(app.includes('function renderHeroBoardArt()'), 'dashboard art is generated from game visuals');
  assert.ok(app.includes('PLAYER_COLORS.map') || app.includes('colors.map((color,index)'), 'every selectable player color has a dashboard pawn');
  assert.ok(app.includes('class="hero-board-blueprint"') && app.includes('class="hero-board-path"'), 'the low contrast board and route sit behind the pawns');
  assert.ok(app.includes('${renderHeroBoardArt()}'), 'the dashboard renders the original board artwork');
  assert.ok(finishCss.includes('.hero-board-art') && finishCss.includes('opacity: .22'), 'the blueprint stays subdued behind the text');
});

test('legacy light and recovery surfaces resolve to the same navy game palette', () => {
  assert.ok(html.includes('cyberrota-finish.css?v=11'), 'the final palette is loaded after every legacy theme');
  assert.ok(finishCss.includes('body.in-game .game-control-dock .heal-node-button'), 'the recovery action receives the current game palette');
  assert.ok(finishCss.includes('background: linear-gradient(135deg,#103629,#123b31)'), 'healing remains green-coded without the former pale card');
  assert.ok(finishCss.includes('body:not(.in-game) .metric-strip') && finishCss.includes('body:not(.in-game) .mode-card'), 'dashboard surfaces use the same dark navy system');
  assert.ok(finishCss.includes('body.in-game .feedback-title') && finishCss.includes('body.in-game .feedback-answer'), 'answer feedback retains readable contrast on the dark game surface');
});

test('the Defense table is smaller and its racks and laser impacts share separated positions', () => {
  assert.ok(app.includes('coopBoardScale(game.coop.maxRounds)'), 'the board fits each selected match length as a single aligned composition');
  assert.ok(app.includes('if(maxRounds<=20)return .9;if(maxRounds>=27)return .83;return .86;'), 'short, standard and challenge matches each use a fitted scale');
  assert.ok(app.includes('M500 42 940 280 500 518 60 280Z'), 'the floor is a clean isometric square');
  assert.ok(app.includes('fisica:[365,275],rede:[365,160],transporte:[585,275],aplicacao:[290,245],seguranca:[660,245]'), 'the five server racks occupy distinct interior bays away from the road');
  assert.ok(app.includes('fisica:[400,317],rede:[400,202],transporte:[620,317],aplicacao:[325,287],seguranca:[695,287]'), 'laser impacts align with the repositioned racks');
  assert.ok(app.includes('function coopPosition()'), 'route rendering clamps missing or invalid positions instead of showing NaN');
});

test('the final Hacker attacks do not roll beyond the destination', () => {
  assert.ok(app.includes('atFinish=position>=Core.DESTINATION'), 'the final route state is explicit in the co-op turn');
  assert.ok(app.includes("data-action=\"${roll||atFinish?'coop-ready':'roll'}\""), 'the arrived team answers directly instead of rolling again');
  assert.ok(app.includes("if(!game.coopRoll&&game.coop.position<Core.DESTINATION)break"), 'the final attack does not require a die value');
  assert.ok(app.includes('Atacar Hacker'), 'the action tells players they are resolving the final attack');
});

test('multiplayer results show a human-only podium with avatar details and host room controls', () => {
  assert.ok(app.includes('function renderMultiplayerPodium()'), 'co-op and 3v3 results share the podium renderer');
  assert.ok(app.includes('Core.rankPodium(game.players||[])'), 'the podium uses the tested difficulty-weighted ranking');
  assert.ok(app.includes('renderBoardPawnAvatar(avatar,color)'), 'each place shows the participant’s selected pawn');
  assert.ok(app.includes('Fácil ') && app.includes('Média ') && app.includes('Difícil '), 'each podium place exposes correct answers by difficulty');
  assert.ok(app.includes('data-action="room-next-match"') && app.includes('data-action="room-close"'), 'the host can start another match or close the room');
  assert.ok(app.includes("stage==='button'&&!game.room?renderMultiplayerPodium():''"), 'offline co-op keeps its podium after the victory sequence while online rooms use the shared overlay');
  assert.ok(app.includes('postgame-podium') && app.includes('is-empty'), 'a short roster keeps empty positions visible');
  assert.ok(html.includes('podium.css'), 'the dedicated podium layout is loaded after the existing game styles');
});
