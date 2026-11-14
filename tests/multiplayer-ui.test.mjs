import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/multiplayer-ui.js', import.meta.url), 'utf8');

test('online launcher offers co-op, fixed 3v3, join-by-code, and custom deck selection', () => {
  const markup = source.slice(source.indexOf('function launchMarkup'), source.indexOf('function currentPlayer'));
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

test('online question UI renders answer choices and disables turns for non-active players', () => {
  const question = source.slice(source.indexOf('function renderQuestion'), source.indexOf('function renderPodium'));
  assert.match(question, /card\.question \|\| card\.prompt/);
  assert.match(question, /myTurn \? '' : 'disabled'/);
  assert.match(question, /data-online-answer/);
  assert.doesNotMatch(question, /<\/script/);
});

test('online race UI shows the room code, roster, and active turn', () => {
  const markup = source.slice(source.indexOf('function gameMarkup'), source.indexOf('function renderQuestion'));
  assert.match(markup, /snapshot\.code/);
  assert.match(markup, /snapshot\.players/);
  assert.match(markup, /Rolar dado/);
});

test('a started room leaves the modal lobby and renders the existing full-screen board', async () => {
  const board = await readFile(new URL('../dist/online-board.js', import.meta.url), 'utf8');
  assert.match(board, /function onlineBoardMarkup\(/);
  assert.match(board, /RaceMode\.boardScene\(/);
  assert.match(board, /function cooperativeBoardMarkup\(/);
  assert.match(source, /gameSurfaceActive/);
  assert.match(source, /document\.body\.classList\.add\('in-game'\)/);
  assert.match(source, /document\.getElementById\('app'\)/);
  assert.match(source, /game-layout/);
  assert.match(source, /data-room-root/);
});
