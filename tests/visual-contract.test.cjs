const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/play-redesign.css'), 'utf8');
const hackerCss = fs.readFileSync(path.join(root, 'dist/hacker-visual.css'), 'utf8');

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
  assert.ok(app.includes("class=\"coop-player-token '+(active?'is-current':'')+'\""), 'all six players are individually represented on the shared route pawn');
  assert.ok(app.includes('playerMotion=pawnSteps?') && app.includes('point[0]+dx') && app.includes('point[1]+dy'), 'every pawn keeps its own spacing while the shared token animates along the path');
  assert.ok(app.includes('game.coop.players.map((player,index)=>'), 'the roster and board tokens derive from the full room roster');
});

test('the defense board gives every rack clear road clearance and widens the pawn platform', () => {
  const rackConfig = app.match(/const rackPositions=({[^;]+});/)?.[1];
  assert.ok(rackConfig, 'rack layout is explicit so its clearance can be reviewed');
  const rackPositions = Object.fromEntries([...rackConfig.matchAll(/(\w+):\[(\d+),(\d+)\]/g)].map((match) => [match[1], [Number(match[2]), Number(match[3])]]));
  const route = JSON.parse(app.match(/const coopPath=(\[\[[^;]+\]\]);/)?.[1] || '[]');
  const routeHalfX = 27 * 1.3;
  const routeHalfY = 17 * 1.3;
  const rackScale = 0.46;
  const rackBounds = Object.entries(rackPositions).map(([name, [x, y]]) => ({ name, left: x - 17 * rackScale, right: x + 103 * rackScale, top: y - 5 * rackScale, bottom: y + 190 * rackScale }));
  for (const rack of rackBounds) {
    for (const [x,y] of route) {
      const overlaps = rack.left < x + routeHalfX && rack.right > x - routeHalfX && rack.top < y + routeHalfY && rack.bottom > y - routeHalfY;
      assert.equal(overlaps, false, `${rack.name} rack stays clear of the platform at ${x},${y}`);
    }
  }
  for (let i=0;i<rackBounds.length;i++) for (let j=i+1;j<rackBounds.length;j++) {
    const a=rackBounds[i],b=rackBounds[j];
    assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top, `${a.name} and ${b.name} racks do not overlap`);
  }
  assert.ok(app.includes("transform=\"translate('+x+' '+y+') scale(1.3)\""), 'route platforms are widened to fit the compact team formation');
  assert.ok(app.includes('scale(.46)'), 'server buildings are sized for the interior bays');
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
  assert.ok(app.includes("renderPlayerAvatar(avatarIndex,color)+'</span><span>'+esc(player.name)"), 'each roster entry displays its matching piece portrait');
  assert.ok(app.includes('renderPlayerAvatar(index,color)'), 'the board pawns reuse the distinct piece silhouettes');
  assert.ok(app.includes('class=\"player-color-robot\" x=\"-11.2\" y=\"-13.3\" width=\"22.4\" height=\"26.6\" viewBox=\"0 0 64 76\"'), 'the six pions use a centered, bounded SVG viewport');
});

test('the defense route stays clear of server bays and the defense hub', () => {
  assert.ok(app.includes('fisica:[300,190],rede:[410,150],transporte:[590,190],aplicacao:[385,260],seguranca:[604,285]'), 'server racks sit in interior bays away from route tiles');
  assert.ok(!app.includes('M500 409V488'), 'no hub cable crosses the route or start tile');
});

test('turn and victory notices are large centered overlays over the gameplay', () => {
  assert.ok(hackerCss.includes('body.in-game .coop-turn-card .turn-announcement { position: fixed;'), 'turn announcement overlays the middle of gameplay');
  assert.ok(hackerCss.includes('font: 900 clamp(36px,7vw,78px)'), 'turn announcement is readable at a glance');
  assert.ok(hackerCss.includes('body.in-game .victory-overlay h1 { margin-top: 6px; font: 850 clamp(38px,6.4vw,76px)'), 'victory is presented large and centered on the board');
});

test('restored co-op saves derive armor damage stages from their recorded hits', () => {
  assert.ok(app.includes("restored.coop.armorStage=Math.max(Number(restored.coop.armorStage)||0,restored.coop.log.filter((event)=>event.outcome==='correct').length)"), 'older saved games restore missing armor stages from the combat log');
  assert.ok(html.includes('game-core.js?v=13'), 'the browser reloads the current damage logic instead of using a cached combat engine');
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
  assert.ok(app.includes('fisica:[300,190],rede:[410,150],transporte:[590,190],aplicacao:[385,260],seguranca:[604,285]'), 'all racks sit in separated interior bays away from the route and base');
  assert.ok(app.includes('const coopPath=[[120,280],[175,310],[240,340],[305,370],[370,400],[435,430],[500,470],[565,430],[630,400],[695,370],[760,340],[825,310],[880,280],[825,250],[760,220],[695,190],[630,160],[560,125],[500,128]];'), 'the 19 walkable spaces follow the board perimeter with room for their larger platforms');
  const route = JSON.parse(app.match(/const coopPath=(\[\[[^;]+\]\]);/)?.[1] || '[]');
  assert.equal(route.length, 19, 'the route contains 19 distinct walkable spaces');
  for (const [x,y] of route) assert.ok(Math.abs(x-500)/440 + Math.abs(y-280)/238 <= 1 - 28/238, `platform at ${x},${y} stays inside the board with a margin`);
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
  assert.ok(app.includes('class="victory-overlay"'), 'the final win state has a visible overlay');
  assert.ok(app.includes('data-action="finish-session"'), 'the victory view can return to the game modes');
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
});

test('the Defense table is smaller and its racks and laser impacts share separated positions', () => {
  assert.ok(app.includes('class="coop-board-layout" transform="translate(500 280) scale(.86) translate(-500 -280)"'), 'the square board is reduced as a single aligned composition');
  assert.ok(app.includes('M500 42 940 280 500 518 60 280Z'), 'the floor is a clean isometric square');
  assert.ok(app.includes('fisica:[300,190],rede:[410,150],transporte:[590,190],aplicacao:[385,260],seguranca:[604,285]'), 'the five server racks occupy distinct interior bays away from the road');
  assert.ok(app.includes('fisica:[320,242],rede:[430,202],transporte:[610,242],aplicacao:[405,312],seguranca:[624,337]'), 'laser impacts align with the repositioned racks');
  assert.ok(app.includes('function coopPosition()'), 'route rendering clamps missing or invalid positions instead of showing NaN');
});

test('the final Hacker attacks do not roll beyond the destination', () => {
  assert.ok(app.includes('atFinish=position>=Core.DESTINATION'), 'the final route state is explicit in the co-op turn');
  assert.ok(app.includes("data-action=\"${roll||atFinish?'coop-ready':'roll'}\""), 'the arrived team answers directly instead of rolling again');
  assert.ok(app.includes("if(!game.coopRoll&&game.coop.position<Core.DESTINATION)break"), 'the final attack does not require a die value');
  assert.ok(app.includes('Atacar Hacker'), 'the action tells players they are resolving the final attack');
});
