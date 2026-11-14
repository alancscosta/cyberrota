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
  assert.match(controls, /import\s*\{\s*RoomClient\s*,\s*renderLobby\s*\}\s*from\s*['"]\.\/room-client\.js['"]/);
  assert.match(roomClient, /export\s*\{[^}]*\bRoomClient\b[^}]*\brenderLobby\b[^}]*\}/s);
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

test('online matches reuse the original game renderer and send its controls to the room server', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /CyberrotaOnlineRenderer/);
  assert.match(app, /renderRaceDiceTray/);
  assert.match(app, /game\.roll/);
  assert.match(app, /game\.answer/);
  assert.match(app, /TURN_INTRO_SECONDS/);
  assert.match(app, /game\.turnClock=onlineRendererState\.clock/);
  const onlineClock = app.slice(app.indexOf('function syncOnlineTurnClock'), app.indexOf('function renderOnlineSnapshot'));
  assert.match(onlineClock, /remote\.currentPlayerId,remote\.turnDeadlineAt/);
  assert.match(onlineClock, /deadline-TURN_SECONDS\*1000/);
  assert.doesNotMatch(onlineClock, /\.command\(/, 'online countdown never rolls or answers on behalf of the player');
  assert.match(app, /rankPodium/);
  assert.match(source, /CyberrotaOnlineRenderer\.render/);
  assert.doesNotMatch(source, /online-turn-card|function gameMarkup/);
});

test('finished online rooms reuse the original 3D podium and room actions', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(source, /CyberrotaOnlineRenderer\?\.finish/);
  assert.match(app, /function renderMultiplayerPodium\(/);
  assert.match(app, /renderBoardPawnAvatar\(avatar,color\)/);
  assert.match(app, /data-action="room-next-match"/);
  assert.match(app, /data-action="room-close"/);
});
