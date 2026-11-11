const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/play-redesign.css'), 'utf8');
const hackerCss = fs.readFileSync(path.join(root, 'dist/hacker-visual.css'), 'utf8');
const finishCss = fs.readFileSync(path.join(root, 'dist/cyberrota-finish.css'), 'utf8');

test('the interface bundles IBM Plex Sans locally and overrides legacy font rules', () => {
  assert.ok(hackerCss.includes('font-family: "IBM Plex Sans"'), 'the interface selects IBM Plex Sans');
  assert.ok(hackerCss.includes('IBMPlexSans-latin.woff2'), 'the font is served from the project');
  assert.ok(hackerCss.includes('body.in-game .hacker-head h3'), 'the Hacker panel overrides its legacy Inter rule');
  assert.ok(hackerCss.includes('font-size: 17px'), 'answer text has a readable size');
  assert.ok(hackerCss.includes('game-control-dock h2'), 'game question and phase headings receive larger type');
  assert.ok(fs.existsSync(path.join(root, 'dist/assets/IBMPlexSans-latin.woff2')));
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

test('each player chooses a unique color and sees its matching robot avatar before joining', () => {
  assert.ok(app.includes('const PLAYER_COLOR_LABELS = ['), 'the six player colors have visible names');
  assert.ok(app.includes('function renderPlayerAvatar(index,color)'), 'every color has a rendered robot avatar');
  assert.ok(app.includes("data-color-index=\"'+colorIndex+'\""), 'color choices expose their palette index to the setup form');
  assert.ok(app.includes('takenByOther=selectedColors.some((value,other)=>other!==index&&value===colorIndex)'), 'a color used by another player is disabled');
  assert.ok(app.includes('new Set(selectedColorIndexes).size!==names.length'), 'starting a game rejects duplicate colors even if form state is tampered');
  assert.ok(app.includes('color:PLAYER_COLORS[selectedColorIndexes[index]]'), 'the selected color follows each player into the game state');
  assert.ok(app.includes("player.color||playerColors[index%playerColors.length]"), 'the selected color drives in-game player avatars and tokens');
});

test('co-op player avatars have six silhouettes and appear in the roster and on the pawn', () => {
  assert.ok(app.includes('PLAYER_AVATAR_SHAPES'), 'the six participant colors map to distinct board-piece silhouettes');
  assert.ok(app.includes('renderPlayerAvatar(index,color)'), 'the piece portrait uses the selected color');
  assert.ok(app.includes("renderBoardPawnAvatar(avatarIndex,color)+'</span><span>'+esc(player.name)"), 'each roster entry displays its matching piece portrait');
  assert.ok(app.includes('renderPlayerAvatar(index,color)'), 'the board pawns reuse the distinct piece silhouettes');
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
  assert.ok(hackerCss.includes('body.in-game .victory-overlay h1 { margin-top: 6px; font: 850 clamp(38px,6.4vw,76px)'), 'victory is presented large and centered on the board');
});

test('restored co-op saves derive armor damage stages from their recorded hits', () => {
  assert.ok(app.includes("restored.coop.armorStage=Math.max(Number(restored.coop.armorStage)||0,restored.coop.log.filter((event)=>event.outcome==='correct').length)"), 'older saved games restore missing armor stages from the combat log');
  assert.ok(html.includes('game-core.js?v=14'), 'the browser reloads the current damage and victory timing logic');
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

test('turn prompts and dice use the active player color with readable light contrast', () => {
  assert.ok(app.includes('const PLAYER_COLORS = [') && app.includes('style="--turn-color:${turnColor}"'), 'the active player color is shared with the die');
  assert.ok(app.includes('class="turn-announcement"') && app.includes('SUA VEZ!!!'), 'the current player gets a clear turn announcement');
  assert.ok(hackerCss.includes('.dice-face') && hackerCss.includes('background: #f7fbff') && hackerCss.includes('color: #17324a'), 'the colored die uses a white face and dark readable pips');
  assert.ok(hackerCss.includes('turn-announcement-fade'), 'the turn prompt fades in and out');
});

test('larger route platforms and the victory message fade in and out', () => {
  assert.ok(app.includes('M-27 7 Q-27 4 -23 2'), 'route platforms have a larger visible footprint');
  assert.ok(hackerCss.includes('turn-announcement-fade'), 'the turn prompt fades in and out');
  assert.ok(hackerCss.includes('victory-message-fade'), 'the final victory message fades in and out');
});

test('the co-op victory keeps the board and presents a green finish state', () => {
  assert.ok(app.includes('function renderCoopVictory()'), 'co-op victory has a dedicated board-preserving scene');
  assert.ok(app.includes('Core.coopVictoryStage(sequence.startedAt)'), 'the final message waits for the tested slow-motion stage progression');
  assert.ok(app.includes("stage==='button'?'<button class=\"victory-return\" data-action=\"finish-session\">Ir ao menu</button>':''"), 'the menu button only exists in the stage revealed after the three-second victory message');
  assert.ok(app.includes("victorySequence={stage:'explosion',startedAt:Date.now()}"), 'the explosion timing starts with the winning hit');
  assert.ok(app.includes('class="victory-overlay"'), 'the final win state has a visible overlay after the explosion');
  assert.ok(app.includes("${bossDefeated?'boss-defeated ':''}"), 'the Hacker is hidden after the final explosion');
  assert.ok(app.includes('class="boss-final-explosion"'), 'the final blast is rendered on the Hacker');
  assert.ok(app.includes('class="boss-final-part ${part.name}"'), 'the final wreck uses recognizable robot assemblies');
  assert.ok(app.includes("name:'head'"), 'the head is one of the falling parts');
  assert.ok(app.includes("name:'torso'"), 'the torso is one of the falling parts');
  assert.ok(app.includes("name:'left-arm'"), 'the arms are separated into falling parts');
  assert.ok(app.includes("name:'left-leg'"), 'the legs are separated into falling parts');
  assert.ok(!app.includes('boss-rubble-part'), 'generic small cube shrapnel is not used for the boss');
  assert.ok(hackerCss.includes('.victory-overlay'), 'the victory state uses the game visual system');
  assert.ok(hackerCss.includes('#67e69a'), 'victory uses the established green success color');
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
  assert.ok(html.includes('cyberrota-finish.css?v=7'), 'the final palette is loaded after every legacy theme');
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
