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

test('online room setup waits for the room controls module instead of opening an empty dialog', async () => {
  const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(app, /mountOnlineRoomLauncher\(mode\)/);
  assert.match(app, /cyberrota:rooms-ready/);
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
