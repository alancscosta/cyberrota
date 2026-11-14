import { RoomClient, renderLobby } from './room-client.js';

const CODE = /^(?=(?:[^A-Z]*[A-Z]){3}[^A-Z]*$)(?=(?:[^2-9]*[2-9]){3}[^2-9]*$)[A-HJ-NP-Z2-9]{6}$/;
const attached = new WeakSet();
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const colors = ['#43d6ff', '#769bff', '#ffbd68', '#d49bff', '#72e0b3', '#ff8e9b'];
let gameSurfaceActive = false;

function readSavedCode() { return new URL(location.href).searchParams.get('sala')?.trim().toUpperCase() || ''; }

function launchMarkup(profile, customDecks, selectedMode = 'coop') {
  const code = readSavedCode();
  const decks = [{ name: 'Padrão', value: 'standard' }, ...(customDecks || []).map((deck, index) => ({ name: deck.name, value: String(index) }))];
  return `<section class="online-rooms-panel"><div class="online-rooms-heading"><div><span class="room-eyebrow">JOGUE COM OUTRAS PESSOAS</span><h2>Salas online</h2><p>Crie uma sala e compartilhe o código ou entre na sala de alguém.</p></div><span class="online-free-tag">GRATUITO</span></div>
    <div class="online-rooms-grid"><form data-create-online-room><h3>Criar sala</h3><label>Seu nome<input name="name" maxlength="20" required value="${esc(profile || 'Jogador convidado')}"></label><label>Modo<select name="mode"><option value="coop" ${selectedMode === 'coop' ? 'selected' : ''}>Defenda a Rede · cooperativo</option><option value="competitive" ${selectedMode === 'competitive' ? 'selected' : ''}>Desligue o Servidor · 3v3</option></select></label><label data-capacity-field>Vagas<select name="capacity">${[2,3,4,5,6].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} jogadores</option>`).join('')}</select></label><label>Baralho<select name="deck">${decks.map((deck) => `<option value="${esc(deck.value)}">${esc(deck.name)}</option>`).join('')}</select></label><button class="room-primary-button" type="submit">Criar e abrir lobby</button><p data-room-error role="status"></p></form>
    <form data-join-online-room><h3>Entrar em uma sala</h3><label>Código da sala<input name="code" maxlength="6" minlength="6" autocomplete="off" placeholder="3 letras e 3 números" value="${esc(code)}" required></label><label>Seu nome<input name="name" maxlength="20" required value="${esc(profile || 'Jogador convidado')}"></label><button class="room-secondary-button" type="submit">Entrar no lobby</button><p data-join-error role="status"></p></form></div>
    <div data-room-root></div></section>`;
}

function renderActive(root, client) {
  const snapshot = client.snapshot;
  if (!snapshot) return;
  if (snapshot.code && snapshot.status !== 'closed') {
    const url = new URL(location.href);
    if (url.searchParams.get('sala') !== snapshot.code) { url.searchParams.set('sala', snapshot.code); history.replaceState(null, '', url); }
  }
  const appRoot = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  if (snapshot.status === 'playing') { gameSurfaceActive = true; modalRoot.innerHTML = ''; if (window.CyberrotaOnlineRenderer?.render) { window.CyberrotaOnlineRenderer.render(snapshot, client); return; } appRoot.innerHTML = '<section class="room-lobby online-room-error">Não foi possível carregar a tela da partida. Atualize a página para tentar novamente.</section>'; return; }
  if (snapshot.status === 'finished') { gameSurfaceActive = true; modalRoot.innerHTML = ''; document.body.classList.add('in-game'); appRoot.innerHTML = window.CyberrotaOnlineRenderer?.finish ? window.CyberrotaOnlineRenderer.finish(snapshot, client) : '<section class="room-lobby online-room-error">A partida terminou. Atualize a página para abrir o resultado.</section>'; return; }
  if (snapshot.status === 'closed') { client.destroy(); window.RoomClient.active = null; history.replaceState(null, '', location.pathname); if (gameSurfaceActive) { gameSurfaceActive = false; document.body.classList.remove('in-game'); modalRoot.innerHTML = ''; appRoot.innerHTML = `<section class="room-lobby online-room-closed"><p class="room-helper">A SALA COD: ${esc(snapshot.code)} foi encerrada.</p><button class="room-primary-button" data-room-home>Voltar ao painel</button></section>`; appRoot.querySelector('[data-room-home]')?.addEventListener('click', () => location.reload()); } else root.innerHTML = `<p class="room-helper">A SALA COD: ${esc(snapshot.code)} foi encerrada pelo anfitrião.</p>`; return; }
  if (gameSurfaceActive) { modalRoot.innerHTML = ''; document.body.classList.remove('in-game'); renderLobby(appRoot, snapshot, client.player?.playerId, client, { onClosed: () => renderActive(root, client) }); bindLobbyActions(appRoot, client); return; }
  renderLobby(root, snapshot, client.player?.playerId, client, { onClosed: () => renderActive(root, client) });
}

function bindLobbyActions(root, client) {
  root.querySelector('[data-room-next]')?.addEventListener('click', async () => { try { await client.nextMatch(); } catch (error) { alert(error.message); } });
  root.querySelector('[data-room-close]')?.addEventListener('click', async () => { if (!confirm('Encerrar esta sala para todos?')) return; try { await client.closeRoom(); } catch (error) { alert(error.message); } });
}

function mount(container, { profile = 'Jogador convidado', customDecks = [], standardDeck = [], initialMode = 'coop' } = {}) {
  if (!container) return;
  if (!container.innerHTML) container.innerHTML = launchMarkup(profile, customDecks, initialMode);
  const root = container.querySelector('[data-room-root]');
  if (!root) return;
  let client = window.RoomClient.active;
  if (!client || client.closedByUser) client = null;
  if (client) { renderActive(root, client); return; }
  if (attached.has(container)) return;
  attached.add(container);
  const createForm = container.querySelector('[data-create-online-room]');
  const joinForm = container.querySelector('[data-join-online-room]');
  const mode = createForm.elements.mode;
  mode.addEventListener('change', () => { container.querySelector('[data-capacity-field]').hidden = mode.value === 'competitive'; });
  createForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const errorBox = createForm.querySelector('[data-room-error]'); errorBox.textContent = '';
    const deckChoice = createForm.elements.deck.value;
    const deck = deckChoice === 'standard' ? standardDeck : customDecks[Number(deckChoice)]?.cards;
    if (!Array.isArray(deck) || !deck.length) { errorBox.textContent = 'O baralho escolhido não tem cartas.'; return; }
    client = new RoomClient({ onEvent: () => renderActive(root, client) }); window.RoomClient.use(client);
    const config = { deck, difficulty: 'all', chapter: 'all', hackerHp: 20, maxRounds: 24, difficultyMode: 'normal' };
    try {
      const result = await client.createRoom({ mode: mode.value, capacity: mode.value === 'competitive' ? 6 : Number(createForm.elements.capacity.value), name: createForm.elements.name.value, colorIndex: 0, config });
      client.snapshot = result.snapshot; history.replaceState(null, '', `?sala=${encodeURIComponent(result.snapshot.code)}`); renderActive(root, client);
    } catch (error) { window.RoomClient.active = null; client.destroy(); errorBox.textContent = error.message; }
  });
  joinForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const errorBox = joinForm.querySelector('[data-join-error]'); errorBox.textContent = '';
    const code = joinForm.elements.code.value.trim().toUpperCase(); if (!CODE.test(code)) { errorBox.textContent = 'O código precisa ter 3 letras e 3 números.'; return; }
    client = new RoomClient({ code, onEvent: () => renderActive(root, client) }); window.RoomClient.use(client);
    try {
      const saved = client.savedPlayer();
      let result;
      if (saved) result = await client.resume();
      else {
        const current = await client.request(`/api/rooms/${encodeURIComponent(code)}`);
        const occupied = new Set((current.snapshot?.players || []).map((player) => player.colorIndex));
        const colorIndex = colors.findIndex((_, index) => !occupied.has(index));
        if (colorIndex < 0) throw new Error('Todas as cores já foram escolhidas.');
        result = await client.joinRoom(code, { name: joinForm.elements.name.value, colorIndex });
      }
      client.snapshot = result.snapshot; history.replaceState(null, '', `?sala=${encodeURIComponent(code)}`); renderActive(root, client);
    } catch (error) {
      window.RoomClient.active = null; client.destroy();
      if (error.newCode) { joinForm.elements.code.value = error.newCode; errorBox.textContent = `O anfitrião trocou o código. SALA COD: ${error.newCode}; tente entrar novamente.`; }
      else errorBox.textContent = error.message;
    }
  });
  const initialCode = readSavedCode();
  if (initialCode && CODE.test(initialCode)) {
    const saved = new RoomClient({ code: initialCode, onEvent: () => renderActive(root, saved) });
    if (saved.savedPlayer()) {
      window.RoomClient.use(saved);
      saved.resume().then((result) => { saved.snapshot = result.snapshot; renderActive(root, saved); }).catch(() => { window.RoomClient.active = null; });
    }
  }
}

export { launchMarkup, mount };
if (typeof window !== 'undefined') {
  window.CyberrotaRooms = { mount };
  window.dispatchEvent(new Event('cyberrota:rooms-ready'));
}
