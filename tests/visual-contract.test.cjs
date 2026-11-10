const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
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
  assert.ok(app.includes('class="defense-hub" transform="translate(500 370)"'), 'the defense hub remains on the board centerline');
  assert.ok(app.includes('class="boss-model boss-scene-figure'), 'the external Hacker uses the centered SVG mount');
  assert.ok(app.includes('class="hub-entry-link" d="M500 457V500"'), 'a centered cable visibly joins the base to the starting space');
});

test('a player hit renders short lived smoke and flame after the blast', () => {
  assert.ok(app.includes('class="boss-aftermath"'), 'after-effects are part of the rendered Hacker hit');
  assert.ok(app.includes("bossHit?'<g class=\"boss-aftermath\""), 'after-effects only exist during an actual hit');
  assert.ok(hackerCss.includes('hacker-smoke-rise 1.45s ease-out .78s both'));
  assert.ok(hackerCss.includes('hacker-fire-fade 1.2s ease-out .55s both'));
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
  assert.ok(app.includes('fisica:[190,175],rede:[315,195],transporte:[700,185],aplicacao:[805,220],seguranca:[440,205]'), 'all racks sit inside the board away from the robot and base');
  assert.ok(app.includes('const coopPath=[[95,280],[160,318],[225,356],[290,394],[355,432],[428,478],[500,515],[572,478],[645,432],[710,394],[775,356],[840,318],[905,280],[840,242],[775,204],[710,166],[645,128],[575,90],[500,128]];'), 'the 19 walkable spaces follow the board perimeter');
  assert.equal((app.match(/d="M\$\{coopPathD\}"/g) || []).length, 2, 'the road edge and dashes use the same route points');
  assert.ok(app.includes('M500 42 940 280 500 518 60 280Z'), 'the isometric square keeps a clear gap below the external robot platform');
  assert.ok(app.includes('M500 75 850 280 500 485 150 280Z') && app.includes('M500 108 786 280 500 451 214 280Z'), 'the earlier subtle circuit traces are restored');
  assert.ok(app.includes('class="defense-hub" transform="translate(500 370)"'), 'the base remains centered on the board');
  assert.ok(app.includes('class="hub-totem" transform="translate(0 -14)"'), 'the defense totem sits higher on its platform');
  assert.ok(app.includes('class="hub-entry-link" d="M500 457V500"'), 'the centered link joins the base to the starting space');
});

test('the co-op victory keeps the board and presents a green finish state', () => {
  assert.ok(app.includes('function renderCoopVictory()'), 'co-op victory has a dedicated board-preserving scene');
  assert.ok(app.includes('class="victory-overlay"'), 'the final win state has a visible overlay');
  assert.ok(app.includes('data-action="finish-session"'), 'the victory view can return to the game modes');
  assert.ok(app.includes("${bossDefeated?'boss-defeated ':''}"), 'the Hacker is hidden after the final explosion');
  assert.ok(app.includes('class="boss-final-explosion"'), 'the final blast is rendered on the Hacker');
  assert.ok(app.includes('class="boss-rubble-part'), 'detached armor remains on the ground after defeat');
  assert.ok(hackerCss.includes('.victory-overlay'), 'the victory state uses the game visual system');
  assert.ok(hackerCss.includes('#67e69a'), 'victory uses the established green success color');
  assert.ok(hackerCss.includes('animation: boss-final-fade .72s ease-out both !important'), 'the final destruction overrides legacy robot idle styles');
  assert.ok(hackerCss.includes('body.in-game .boss-model.boss-defeated { opacity: 0 !important; }'), 'reduced motion still leaves the final defeated pose');
});

test('the Defense table is smaller and its racks and laser impacts share separated positions', () => {
  assert.ok(app.includes('class="coop-board-layout" transform="translate(500 280) scale(.86) translate(-500 -280)"'), 'the square board is reduced as a single aligned composition');
  assert.ok(app.includes('M500 42 940 280 500 518 60 280Z'), 'the floor is a clean isometric square');
  assert.ok(app.includes('fisica:[190,175],rede:[315,195],transporte:[700,185],aplicacao:[805,220],seguranca:[440,205]'), 'the five server racks have distinct interior positions');
  assert.ok(app.includes('fisica:[232,230],rede:[357,250],transporte:[742,240],aplicacao:[847,275],seguranca:[482,260]'), 'laser impacts match the repositioned rack faces');
});

test('the final Hacker attacks do not roll beyond the destination', () => {
  assert.ok(app.includes('atFinish=game.coop.position>=Core.DESTINATION'), 'the final route state is explicit in the co-op turn');
  assert.ok(app.includes("data-action=\"${roll||atFinish?'coop-ready':'roll'}\""), 'the arrived team answers directly instead of rolling again');
  assert.ok(app.includes("if(!game.coopRoll&&game.coop.position<Core.DESTINATION)break"), 'the final attack does not require a die value');
  assert.ok(app.includes('Atacar Hacker'), 'the action tells players they are resolving the final attack');
});
