import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');

test('online launcher offers co-op, fixed 3v3, join-by-code, and custom deck selection', () => {
  const markup = source.slice(source.indexOf('function launchMarkup'), source.indexOf('function renderActive'));
  assert.match(markup, /Defenda a Rede/);
  assert.match(markup, /Desligue o Servidor · 3v3/);
  assert.match(markup, /Entrar em uma sala/);
  assert.match(markup, /3 letras e 3 números/);
  assert.match(markup, /customDecks/);
});

test('home co-op illustration fills the mode-card artwork area with a readable defense scene', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const homeMotion = await readFile(new URL('../dist/home-motion.css', import.meta.url), 'utf8');
  const coOpArt = app.slice(app.indexOf("coop:'<svg"), app.indexOf("</svg>'};return '<div class=\"mode-art"));
  assert.match(coOpArt, /viewBox="0 0 480 110"/);
  assert.match(coOpArt, /stroke="#77c8f2"/);
  assert.match(homeMotion, /#app \.mode-card \.mode-art svg\s*\{[\s\S]*width:\s*100%/);
});

test('lobby offers distinct buttons to copy the room code and share its link', async () => {
  const lobby = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  assert.match(lobby, /data-room-copy-code/);
  assert.match(lobby, /Copiar código/);
  assert.match(lobby, /data-room-copy-link/);
  assert.match(lobby, /Copiar link/);
});

test('lobby host can rotate the room code and choose characters with pawn icons', async () => {
  const lobby = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  assert.match(lobby, /data-room-regenerate/);
  assert.match(lobby, /Gerar outro código/);
  assert.match(lobby, /room-color-pawn/);
  assert.doesNotMatch(lobby, /class="room-color-choice[^`]*<span><\/span>/);
});

test('room client exports the API consumed by the multiplayer controls module', async () => {
  const roomClient = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  const controls = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');
  assert.match(controls, /import\s*\{[^}]*\bcanReuseActiveRoom\b[^}]*\}\s*from\s*['"]\.\/room-client\.js\?v=8['"]/);
  assert.match(roomClient, /export\s*\{[^}]*\bRoomClient\b[^}]*\bcanReuseActiveRoom\b[^}]*\}/s);
});

test('online room setup reports a module load failure instead of staying on an infinite loader', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /mountOnlineRoomLauncher\(mode\)/);
  assert.match(app, /cyberrota:rooms-ready/);
  assert.match(app, /Não foi possível carregar os controles da sala/);
  assert.match(app, /loadTimeout=window\.setTimeout\(/);
  assert.match(app, /},5000\);window\.addEventListener\('cyberrota:rooms-ready'/);
});

test('online room dialog gives the room heading and forms breathing room', async () => {
  const styles = await readFile(new URL('../dist/rooms.css', import.meta.url), 'utf8');
  assert.match(styles, /\.online-room-dialog \.online-rooms-heading\s*\{[^}]*padding:\s*16px\s+18px\s+14px/s);
  assert.match(styles, /\.online-room-dialog \.online-rooms-grid\s*\{[^}]*gap:\s*18px[^}]*padding:\s*16px\s+18px\s+24px/s);
});

test('online match uses the same game controls and board as the existing game', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /CyberrotaOnlineRenderer/);
  assert.match(app, /renderRaceDiceTray/);
  assert.match(source, /CyberrotaOnlineRenderer\.render/);
  assert.match(source, /CyberrotaOnlineRenderer\?\.finish/);
  assert.match(app, /function renderMultiplayerPodium\(/);
  assert.doesNotMatch(source, /online-turn-card|function gameMarkup/);
});

test('a started room leaves the modal lobby and renders the existing full-screen board', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(source, /gameSurfaceActive/);
  assert.match(source, /CyberrotaOnlineRenderer\.render/);
  assert.match(source, /document\.getElementById\('app'\)/);
  assert.match(source, /data-room-root/);
  assert.match(app, /globalThis\.RaceMode\.render\(game/);
  assert.match(app, /function renderBoardScene\(/);
});

test('a newly created room opens its lobby over the create/join screen and closing returns to setup', async () => {
  assert.match(source, /function renderLobbyModal\(/);
  assert.match(source, /class="room-lobby-modal-backdrop"[\s\S]*role="dialog" aria-modal="true"/);
  assert.match(source, /renderLobbyModal\(root,\s*snapshot,\s*client\.player\?\.playerId,\s*client/);
  assert.match(source, /if \(gameSurfaceActive\) \{ gameSurfaceActive = false; document\.body\.classList\.remove\('in-game'\); modalRoot\.innerHTML = ''; appRoot\.innerHTML =/);
  assert.match(source, /else\s+root\.innerHTML\s*=\s*`<p class="room-helper">A SALA COD:/);
  const styles = await readFile(new URL('../dist/rooms.css', import.meta.url), 'utf8');
  assert.match(styles, /\.room-lobby-modal-backdrop\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*backdrop-filter:\s*blur\(/);
});

test('the deployed room, game-core, and lobby style URLs load the updated versions together', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(html, /game-core\.js\?v=18/);
  assert.match(html, /room-client\.js\?v=8/);
  assert.match(html, /multiplayer-ui\.js\?v=8/);
  assert.match(html, /rooms\.css\?v=4/);
  assert.match(html, /app\.js\?v=64/);
  assert.match(html, /hacker-combat\.css\?v=18/);
});

test('a room opened from a saved link keeps rendering websocket snapshots after resuming', async () => {
  const ui = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /from '\.\/room-client\.js\?v=8'/);
  assert.match(ui, /new RoomClient\(\{\s*code: initialCode,\s*onEvent: \(\) => renderActive\(root, saved\)\s*\}\)/);
  assert.match(ui, /canAutoResumeRoom\(current\.snapshot, initialMode\)/);
  assert.match(ui, /saved\.request\(`\/api\/rooms\/\$\{encodeURIComponent\(initialCode\)\}`\)/);
});

test('online matches reuse the original game renderer and send its controls to the room server', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /CyberrotaOnlineRenderer/);
  assert.match(app, /renderRaceDiceTray/);
  assert.match(app, /game\.roll/);
  assert.match(app, /game\.answer/);
  assert.match(app, /TURN_WARNING_SECONDS/);
  assert.match(app, /function renderOnlineTurnBanner\(/);
  assert.match(app, /online-turn-announcement/);
  assert.match(app, /SUA VEZ!!!/);
  assert.match(app, /VEZ DE \$\{esc\(cp\.name\)\}/);
  assert.match(app, /game\.currentPlayerId===game\.localPlayerId\?'SUA VEZ':'VEZ DE '\+esc\(cp\.name\)/);
  assert.match(app, /announcedTurnKey/);
  const raceMode = await readFile(new URL('../dist/race-mode.js', import.meta.url), 'utf8');
  assert.match(raceMode, /VEZ DE \$\{ui\.esc\(player\)\}/);
  assert.match(app, /game\.turnClock=onlineRendererState\.clock/);
  const onlineClock = app.slice(app.indexOf('function syncOnlineTurnClock'), app.indexOf('function renderOnlineSnapshot'));
  assert.match(onlineClock, /remote\.currentPlayerId,remote\.turnDeadlineAt/);
  assert.match(onlineClock, /deadline-onlineNow\(\)/);
  assert.match(app, /serverOffsetMs/);
  assert.match(onlineClock, /remote\.mode==='competitive'/, 'the timeout fallback is limited to 3v3 and leaves co-op gameplay alone');
  assert.match(onlineClock, /command\('game\.skip'/, 'the active player cannot be left at zero if a room alarm is delayed');
  assert.doesNotMatch(onlineClock, /command\('game\.(roll|choose-difficulty|answer)'/, 'online countdown never rolls or answers on behalf of the player');
  assert.match(app, /rankPodium/);
  assert.match(source, /CyberrotaOnlineRenderer\.render/);
  assert.doesNotMatch(source, /online-turn-card|function gameMarkup/);
});

test('Defenda a Rede online renders the difficulty phase without local-only fields and sends Ping to the server', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('game.pending?.theme||game.attackTheme'), 'the online attack theme is the difficulty theme when no local pending event exists');
  assert.ok(app.includes("ping:'game.ping'"), 'Ping is an authoritative room action');
  assert.ok(app.includes('const active=currentPlayer();const pingDisabled=active?.usedPing'), 'online Ping reads the active roster entry safely');
  assert.ok(app.includes('...stats,...player'), 'the online renderer carries authoritative player abilities and scores into the game UI');
  assert.ok(app.includes('[data-action=\"ping\"]'), 'Ping is disabled for players who are not active');
  assert.doesNotMatch(app, /game\.currentPlayerData\.usedPing/);
});

test('online co-op feedback restores the original laser and plays each pawn movement once', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /const combatFx=!!feedbackKey&&Date\.now\(\)<onlineRendererState\.combatFxUntil\|\|!!victoryFx/);
  assert.match(app, /game\.combatFx&&game\.phase==='feedback'&&game\.feedback\?\.correct/);
  assert.match(app, /game\.combatFx=stage==='explosion'/);
  assert.match(app, /lastCoopMoveKey/);
  assert.match(app, /moveAnimationPlayed=true/);
});

test('online turn-change notice finishes before the next player announcement appears', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /function scheduleOnlineTurnAnnouncement\(/);
  assert.match(app, /2200-\(onlineNow\(\)-Number\(notice\.at\)\)/);
  assert.match(app, /onlineTurnNoticeRemaining\(\)>0/);
  assert.match(app, /state\.snapshot\?\.revision!==revision/);
  assert.match(app, /onlineTurnNoticeRemaining\(\)>0\?'TROCA DE TURNO'/);
});

test('the online turn announcement uses the centered full-screen treatment', async () => {
  const styles = await readFile(new URL('../dist/hacker-visual.css', import.meta.url), 'utf8');
  assert.match(styles, /body\.in-game \.online-turn-announcement\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*place-content:\s*center/s);
  assert.match(styles, /body\.in-game \.online-turn-announcement strong\s*\{[^}]*font:\s*900 clamp\(/s);
});

test('finished online rooms reuse the original 3D podium and room actions', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(source, /CyberrotaOnlineRenderer\?\.finish/);
  assert.match(app, /function renderMultiplayerPodium\(/);
  assert.match(app, /renderBoardPawnAvatar\(avatar,color\)/);
  assert.match(app, /data-action="room-next-match"/);
  assert.match(app, /data-action="room-close"/);
});

test('online postgame keeps the finished match behind a centered translucent navy podium', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const podiumCss = await readFile(new URL('../dist/podium.css', import.meta.url), 'utf8');
  assert.match(app, /function renderRoomPostgameOverlay\(/);
  assert.match(app, /renderRaceGame\(\)\+\(game\.phase==='finished'&&game\.room\?renderRoomPostgameOverlay\(\):''\)/);
  assert.match(app, /if\(forFinish\)\{game\.phase='finished';game\.room=\{hostPlayerId:snapshot\.hostPlayerId,hostConnected:[^}]+\};game\.localPlayerId=client\.player\?\.playerId;playOnlineSnapshotAudio\(snapshot,client,feedbackKey\);return renderGame\(\)\.replace\(/);
  assert.match(podiumCss, /\.postgame-backdrop\s*\{/);
  assert.match(podiumCss, /backdrop-filter:\s*blur\(/);
  assert.match(podiumCss, /background:\s*rgba\(5,\s*15,\s*31,\s*\.9\)/);
  assert.match(podiumCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('online postgame gives every player a way out and explains when the host left', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /hostConnected:!!snapshot\.players\?\.find\(\(player\)=>player\.playerId===snapshot\.hostPlayerId\)\?\.connected/);
  assert.match(app, /O anfitrião saiu\. Esta partida foi finalizada\./);
  assert.match(app, /renderRoomHomeButton\('btn btn-primary'\)/);
  assert.match(app, /renderRoomHomeButton\('btn btn-secondary'\)/);
  assert.match(app, /hostConnected===false\?'/);
  assert.ok(app.includes("case'room-home':clearPlayerTurnClock();if(onlineRendererState.roomHomeTimer)window.clearInterval(onlineRendererState.roomHomeTimer);onlineRendererState.roomHomeTimer=null;window.CyberrotaRooms?.leaveActiveRoom?.();stopBackgroundMusic();game=null;page='home';render();break;"));
});

test('room code is always labeled explicitly in the lobby, match, and finished-room states', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const roomClient = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  const multiplayerUi = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');
  assert.match(app, /SALA COD: \$\{esc\(snapshot\.code\)\}/);
  assert.match(roomClient, /SALA COD:<\/small>/);
  assert.match(multiplayerUi, /SALA COD: \$\{esc\(snapshot\.code\)\} foi encerrada/);
});

test('leaving a match and switching modes discards the stale active room and URL code', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');
  const roomClient = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  assert.match(app, /window\.CyberrotaRooms\?\.leaveActiveRoom\?\.\(\)/);
  assert.match(ui, /if \(active && !canReuseActiveRoom\(active, initialMode\)\) leaveActiveRoom\(\)/);
  assert.match(roomClient, /searchParams\.delete\('sala'\)/);
  assert.match(ui, /window\.CyberrotaRooms = \{ mount, leaveActiveRoom \}/);
});

test('online cooperative controls send role actions and hide healing outside the walk phase', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /role:'game\.role'/);
  assert.match(app, /payload=\{role:control\.dataset\.role\}/);
  assert.match(app, /function renderHealingNodes\(\)\{if\(game\.phase!==['"]walk['"]\)return ['"]['"]/);
  assert.match(app, /data-node-id="\$\{index\}"/);
  assert.match(app, /function useRole\(role\)/);
});

test('online guest return waits five seconds while the host keeps immediate room controls', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /function roomHomeWaitRemaining\(/);
  assert.match(app, /roomHomeEnabledAt=Date\.now\(\)\+5000/);
  assert.match(app, /data-room-home-gated/);
  assert.match(app, /function updateRoomHomeCountdown\(/);
  assert.match(app, /game\.localPlayerId===room\.hostPlayerId/);
});

test('lobby marks the host with a crown badge', async () => {
  const roomClient = await readFile(new URL('../dist/room-client.js', import.meta.url), 'utf8');
  const roomsCss = await readFile(new URL('../dist/rooms.css', import.meta.url), 'utf8');
  assert.match(roomClient, /room-host-badge/);
  assert.match(roomClient, /room-host-crown/);
  assert.match(roomsCss, /\.room-host-badge/);
  assert.match(roomsCss, /\.room-host-crown/);
});

test('online snapshots play combat, dice and match-end sounds after browser audio activation', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /function wakeAudioContext\(/);
  assert.match(app, /addEventListener\('pointerdown',wakeAudioContext/);
  assert.match(app, /function playOnlineSnapshotAudio\(/);
  assert.match(app, /playSfx\('charge'\)/);
  assert.match(app, /playSfx\('hacker-scream'\)/);
  assert.match(app, /'victory':'defeat'/);
  assert.match(app, /playSfx\('roll'\)/);
  assert.match(app, /startBackgroundMusic\(\);/);
  assert.match(app, /lastDieKey/);
  assert.match(app, /remote\.coop\?\.round\|\|remote\.race\?\.turn\|\|0/);
  assert.doesNotMatch(app, /lastDieRevision/);
});

test('the Hacker gets a spaced floating health display and a lunge on counterattack', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const combatCss = await readFile(new URL('../dist/hacker-combat.css', import.meta.url), 'utf8');
  assert.match(app, /boss-health-hud/);
  assert.match(app, /HACKER/);
  assert.match(app, /\$\{game\.coop\.hackerHp\} \/ \$\{game\.coop\.startingHp\} PV/);
  assert.match(app, /bossAttack\?\'hacker-attack/);
  assert.match(app, /bossHit\?\'boss-hit/);
  assert.match(app, /const impact=game\.combatFx&&game\.phase==='feedback'\?`impact-active/);
  assert.match(combatCss, /\.impact-rack \.datacenter-rack\.server-hit/);
  assert.match(combatCss, /\.boss-scene-figure\.hacker-attack\s*\{[^}]*animation:boss-charge/);
  assert.match(combatCss, /\.board-coop \.boss-model\.hacker-attack\s*\{[^}]*animation:hacker-board-strike/);
});
