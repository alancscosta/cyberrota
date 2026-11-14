const ROOM_COLORS = [
  { name: 'Ciano', value: '#43d6ff' },
  { name: 'Azul', value: '#769bff' },
  { name: 'Dourado', value: '#ffbd68' },
  { name: 'Lilás', value: '#d49bff' },
  { name: 'Menta', value: '#72e0b3' },
  { name: 'Coral', value: '#ff8e9b' },
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function availableRoomColors(snapshot, localPlayerId) {
  const claimed = new Set((snapshot?.players || []).filter((player) => player.playerId !== localPlayerId).map((player) => player.colorIndex));
  return ROOM_COLORS.map((color, index) => ({ ...color, index })).filter((color) => !claimed.has(color.index));
}

function needsEarlyStartConfirmation(snapshot) {
  const humans = (snapshot?.players || []).filter((player) => !player.isBot).length;
  return humans < Number(snapshot?.capacity || 0);
}

function pawnAvatar(player, extraClass = '') {
  const color = ROOM_COLORS[player.colorIndex]?.value || ROOM_COLORS[0].value;
  const heads = [
    '<circle cx="0" cy="-15" r="6"/>',
    '<rect x="-7" y="-21" width="14" height="12" rx="3"/>',
    '<path d="M0-22 9-9H-9Z"/>',
    '<path d="m0-22 8 4v8L0-5l-8-5v-8Z"/>',
    '<path d="M0-22 9-17 6-8H-6L-9-17Z"/>',
    '<path d="m0-23 3 6 6 1-5 5 2 6-6-3-6 3 2-6-5-5 6-1Z"/>',
  ];
  const index = Math.max(0, Math.min(5, Number(player.colorIndex) || 0));
  return `<svg class="room-pawn ${extraClass}" viewBox="-13 -25 26 36" aria-hidden="true" style="--pawn-color:${color}"><ellipse cx="0" cy="8" rx="10" ry="2.5" class="room-pawn-shadow"/><path d="M-9 0v3c0 3 4 4 9 4s9-1 9-4V0c0 2-4 4-9 4s-9-2-9-4Z" class="room-pawn-base"/><path d="M-5 0c1-3 2-5 2-7v-5h6v5c0 2 1 4 5 7-3 2-10 2-13 0Z" class="room-pawn-body"/><g class="room-pawn-head">${heads[index]}</g></svg>`;
}

function roomApiBase(code, base = '') {
  return `${base}/api/rooms${code ? `/${encodeURIComponent(code)}` : ''}`;
}

function credentialsKey(code) {
  return `cyberrota-room-${String(code).toUpperCase()}`;
}

class RoomClient extends EventTarget {
  constructor({ code = '', apiBase = '', storage = globalThis.localStorage, onEvent = () => {} } = {}) {
    super();
    this.code = String(code).toUpperCase();
    this.apiBase = apiBase;
    this.storage = storage;
    this.onEvent = onEvent;
    this.socket = null;
    this.reconnectTimer = null;
    this.reconnectDelay = 750;
    this.closedByUser = false;
    this.snapshot = null;
    this.player = null;
    this.pollTimer = null;
    this.pollInFlight = false;
  }

  savePlayer(player) {
    this.player = player;
    if (player?.resumeToken && this.code) {
      this.storage?.setItem(credentialsKey(this.code), JSON.stringify({ playerId: player.playerId, resumeToken: player.resumeToken }));
    }
  }

  savedPlayer() {
    try { return JSON.parse(this.storage?.getItem(credentialsKey(this.code)) || 'null'); }
    catch { return null; }
  }

  async request(url, init = {}) {
    const response = await fetch(url, { ...init, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || body.error || `Falha na sala (${response.status}).`);
      error.code = body.error;
      error.requiresConfirmation = body.requiresConfirmation;
      error.newCode = body.newCode;
      throw error;
    }
    return body;
  }

  async createRoom({ mode = 'coop', capacity = 6, name, colorIndex, config = {} }) {
    const result = await this.request(roomApiBase('', this.apiBase), {
      method: 'POST', body: JSON.stringify({ mode, capacity, name, colorIndex, config }),
    });
    this.code = String(result.snapshot.code).toUpperCase();
    this.snapshot = result.snapshot;
    this.savePlayer(result.player);
    this.connect();
    return result;
  }

  async joinRoom(code, { name, colorIndex }) {
    this.code = String(code).trim().toUpperCase();
    const result = await this.request(`${roomApiBase(this.code, this.apiBase)}/join`, {
      method: 'POST', body: JSON.stringify({ name, colorIndex }),
    });
    this.snapshot = result.snapshot;
    this.savePlayer(result.player);
    this.connect();
    return result;
  }

  async resume() {
    const saved = this.savedPlayer();
    if (!saved) throw new Error('Esta vaga não está salva neste dispositivo.');
    let result;
    try { result = await this.request(`${roomApiBase(this.code, this.apiBase)}`, { method: 'GET' }); }
    catch (error) {
      if (!error.newCode) throw error;
      this.adoptRoomCode(error.newCode);
      result = await this.request(`${roomApiBase(this.code, this.apiBase)}`, { method: 'GET' });
    }
    this.snapshot = result.snapshot;
    this.player = saved;
    this.connect();
    return result;
  }

  adoptRoomCode(code) {
    const nextCode = String(code || '').trim().toUpperCase();
    if (!nextCode || nextCode === this.code) return;
    const previousCode = this.code;
    const saved = this.player?.resumeToken ? this.player : this.savedPlayer();
    this.code = nextCode;
    if (saved?.resumeToken) {
      this.storage?.setItem(credentialsKey(nextCode), JSON.stringify({ playerId: saved.playerId, resumeToken: saved.resumeToken }));
      this.storage?.removeItem(credentialsKey(previousCode));
    }
    const previousSocket = this.socket;
    this.socket = null;
    previousSocket?.close(1000, 'room code changed');
    this.connect();
  }

  async rotateCode() {
    const saved = this.player?.resumeToken ? this.player : this.savedPlayer();
    if (!saved?.resumeToken) throw new Error('Entre novamente na sala para trocar o código.');
    const result = await this.request(`${roomApiBase(this.code, this.apiBase)}/rotate`, {
      method: 'POST', body: JSON.stringify({ resumeToken: saved.resumeToken }),
    });
    this.adoptRoomCode(result.newCode || result.snapshot?.code);
    this.snapshot = result.snapshot;
    this.dispatchEvent(new CustomEvent('room', { detail: { type: 'room.snapshot', snapshot: result.snapshot } }));
    this.onEvent({ type: 'room.snapshot', snapshot: result.snapshot });
    return result;
  }

  connect() {
    if (!this.code || this.closedByUser) return null;
    this.startPolling();
    if (!globalThis.WebSocket) return null;
    const saved = this.player?.resumeToken ? this.player : this.savedPlayer();
    if (!saved?.resumeToken) return null;
    const url = new URL(`${roomApiBase(this.code, this.apiBase)}/ws`, globalThis.location?.href || 'http://localhost');
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.reconnectDelay = 750;
      socket.send(JSON.stringify({ action: 'resume', resumeToken: saved.resumeToken }));
    });
    socket.addEventListener('message', (event) => this.receive(event.data));
    socket.addEventListener('close', () => { if (this.socket === socket) this.scheduleReconnect(); });
    socket.addEventListener('error', () => socket.close());
    return socket;
  }

  receive(raw) {
    let event;
    try { event = JSON.parse(raw); } catch { return; }
    if (event.snapshot) this.snapshot = event.snapshot;
    if (event.type === 'room.moved' && event.newCode) this.adoptRoomCode(event.newCode);
    if (event.player?.resumeToken) this.savePlayer(event.player);
    this.dispatchEvent(new CustomEvent('room', { detail: event }));
    this.onEvent(event);
  }

  scheduleReconnect() {
    if (this.closedByUser || this.reconnectTimer || !this.code) return;
    this.dispatchEvent(new CustomEvent('connection', { detail: { status: 'reconnecting' } }));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      this.reconnectDelay = Math.min(10000, this.reconnectDelay * 1.7);
    }, this.reconnectDelay);
  }

  startPolling() {
    if (this.pollTimer || this.closedByUser) return;
    this.pollTimer = setInterval(() => { this.refreshSnapshot().catch(() => {}); }, 2000);
  }

  async refreshSnapshot() {
    if (this.closedByUser || this.pollInFlight || !this.code) return this.snapshot;
    this.pollInFlight = true;
    try {
      const result = await this.request(roomApiBase(this.code, this.apiBase), { method: 'GET' });
      const next = result.snapshot;
      const current = this.snapshot;
      if (next && (!current || next.code !== current.code || Number(next.revision) > Number(current.revision))) {
        this.snapshot = next;
        this.dispatchEvent(new CustomEvent('room', { detail: { type: 'room.snapshot', snapshot: next } }));
        this.onEvent({ type: 'room.snapshot', snapshot: next });
      }
      return this.snapshot;
    } finally { this.pollInFlight = false; }
  }

  async command(action, payload = {}) {
    const saved = this.player?.resumeToken ? this.player : this.savedPlayer();
    if (!saved?.resumeToken) throw new Error('Entre novamente na sala para continuar.');
    const result = await this.request(`${roomApiBase(this.code, this.apiBase)}/command`, {
      method: 'POST', body: JSON.stringify({ resumeToken: saved.resumeToken, action, payload }),
    });
    this.snapshot = result.snapshot;
    this.dispatchEvent(new CustomEvent('room', { detail: { type: 'room.snapshot', snapshot: result.snapshot } }));
    this.onEvent({ type: 'room.snapshot', snapshot: result.snapshot });
    return result.snapshot;
  }

  setIdentity(name, colorIndex) { return this.command('player.identity', { name, colorIndex }); }
  configure(options) { return this.command('room.configure', options); }
  start({ confirmEarly = false } = {}) { return this.command('room.start', { confirmEarly }); }
  nextMatch() { return this.command('room.next-match'); }
  closeRoom() { return this.command('room.close'); }
  publishGameState(gameState) { return this.command('game.state', { gameState }); }

  destroy() {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.reconnectTimer = null;
    this.pollTimer = null;
    this.socket?.close(1000, 'client closed');
    this.socket = null;
  }
}

function roomShareUrl(code, currentUrl = globalThis.location?.href || 'http://localhost/') {
  const url = new URL(currentUrl);
  url.searchParams.set('sala', String(code).toUpperCase());
  return url.toString();
}

function renderLobby(container, snapshot, localPlayerId, client, { onClosed = () => {} } = {}) {
  if (!container || !snapshot) return;
  const local = snapshot.players.find((player) => player.playerId === localPlayerId);
  const isHost = snapshot.hostPlayerId === localPlayerId;
  const choices = availableRoomColors(snapshot, localPlayerId);
  const selectedColor = local?.colorIndex ?? choices[0]?.index ?? 0;
  const title = snapshot.mode === 'competitive' ? 'Desligue o Servidor · 3v3' : 'Defenda a Rede';
  const teamName = (team) => team === 'blue' ? 'AZUL' : team === 'red' ? 'VERMELHO' : '';
  const roster = snapshot.players.map((player) => `<li class="room-player ${player.playerId === localPlayerId ? 'is-you' : ''} ${player.connected ? '' : 'is-away'}">
      ${pawnAvatar(player)}<span class="room-player-copy"><b>${escapeHtml(player.name)}</b><small>${player.isBot ? 'BOT' : player.playerId === snapshot.hostPlayerId ? 'ANFITRIÃO' : 'JOGADOR'}${player.team ? ` · ${teamName(player.team)}` : ''}</small></span>
      <span class="room-player-status" aria-label="${player.connected ? 'Conectado' : 'Desconectado'}">${player.connected ? '●' : '○'}</span>
    </li>`).join('');
  const colorOptions = choices.map((color) => `<button type="button" class="room-color-choice ${color.index === selectedColor ? 'is-selected' : ''}" data-color-index="${color.index}" aria-label="${color.name}" aria-pressed="${color.index === selectedColor}" style="--player-color:${color.value}">${pawnAvatar({ colorIndex: color.index }, 'room-color-pawn')}<small>${color.name}</small></button>`).join('');
  const humanCount = snapshot.players.filter((player) => !player.isBot).length;
  const notFull = humanCount < snapshot.capacity;
  container.innerHTML = `<section class="room-lobby" aria-labelledby="room-lobby-title">
    <header class="room-lobby-header"><div><span class="room-eyebrow">SALA DE PARTIDA · ${snapshot.status === 'playing' ? 'EM JOGO' : 'LOBBY'}</span><h1 id="room-lobby-title">${title}</h1></div>
      <div class="room-code-box"><small>SALA COD:</small><strong>${escapeHtml(snapshot.code)}</strong><div class="room-code-actions"><button type="button" data-room-copy-code>Copiar código</button><button type="button" data-room-copy-link>Copiar link</button>${isHost && snapshot.status === 'lobby' ? '<button type="button" data-room-regenerate>Gerar outro código</button>' : ''}</div></div></header>
    <div class="room-lobby-layout"><section class="room-roster-panel"><div class="room-section-heading"><h2>Participantes</h2><span>${humanCount}/${snapshot.capacity} pessoas</span></div>
      <ul class="room-roster">${roster}</ul><p class="room-helper">Compartilhe o link para seus amigos entrarem. As cores escolhidas somem para os outros.</p></section>
      <section class="room-identity-panel"><div class="room-section-heading"><h2>Sua personagem</h2><span>${local ? 'Edite antes da partida' : 'Entre na sala para escolher'}</span></div>
        ${local ? `<form data-room-identity><label for="room-player-name">Nome</label><input id="room-player-name" name="name" maxlength="20" value="${escapeHtml(local.name)}" autocomplete="nickname"><div class="room-color-list" role="group" aria-label="Cores disponíveis">${colorOptions || '<span class="room-no-colors">Todas as cores já foram escolhidas</span>'}</div><button class="room-secondary-button" type="submit">Salvar personagem</button></form>` : '<p class="room-helper">Entre com o código da sala para escolher um nome e uma cor.</p>'}
        ${isHost && snapshot.status === 'lobby' ? `<label class="room-capacity-label" for="room-mode">Próximo modo</label><select id="room-mode" data-room-mode><option value="coop" ${snapshot.mode === 'coop' ? 'selected' : ''}>Defenda a Rede</option><option value="competitive" ${snapshot.mode === 'competitive' ? 'selected' : ''}>Desligue o Servidor · 3v3</option></select>${snapshot.mode === 'coop' ? `<label class="room-capacity-label" for="room-capacity">Vagas planejadas</label><select id="room-capacity" data-room-capacity>${[2,3,4,5,6].map((n) => `<option value="${n}" ${snapshot.capacity === n ? 'selected' : ''}>${n} pessoas</option>`).join('')}</select>` : '<p class="room-helper">A Corrida 3v3 tem seis assentos fixos.</p>'}` : ''}
      </section></div>
    <footer class="room-lobby-actions">${isHost && snapshot.status === 'lobby' ? `<div><button type="button" class="room-primary-button" data-room-start>Começar partida</button><small>${snapshot.mode === 'competitive' ? 'Vagas restantes serão ocupadas por bots após confirmação.' : 'Você pode iniciar antes de preencher todas as vagas.'}</small></div>` : `<span class="room-waiting">${snapshot.status === 'playing' ? 'Partida em andamento' : 'Aguardando o anfitrião iniciar a partida'}</span>`}
      ${isHost && snapshot.status === 'finished' ? '<button type="button" class="room-secondary-button" data-room-next>Próxima partida</button>' : ''}
      ${isHost && snapshot.status !== 'closed' ? '<button type="button" class="room-danger-button" data-room-close>Encerrar sala</button>' : ''}</footer>
  </section>`;

  container.querySelector('[data-room-copy-code]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText(snapshot.code); button.textContent = 'Código copiado'; }
    catch { button.textContent = snapshot.code; }
  });
  container.querySelector('[data-room-copy-link]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText(roomShareUrl(snapshot.code)); button.textContent = 'Link copiado'; }
    catch { button.textContent = roomShareUrl(snapshot.code); }
  });
  container.querySelector('[data-room-regenerate]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (!globalThis.confirm?.('Gerar outro código? A sala e os jogadores serão mantidos, mas o código anterior deixará de aceitar entradas.')) return;
    button.disabled = true;
    try { await client.rotateCode(); }
    catch (error) { button.disabled = false; globalThis.alert?.(error.message); }
  });
  container.querySelector('[data-room-identity]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = event.currentTarget.elements.name.value;
    const colorIndex = Number(event.currentTarget.querySelector('.room-color-choice.is-selected')?.dataset.colorIndex ?? selectedColor);
    try { await client.setIdentity(name, colorIndex); }
    catch (error) { globalThis.alert?.(error.message); }
  });
  container.querySelectorAll('.room-color-choice').forEach((button) => button.addEventListener('click', () => {
    container.querySelectorAll('.room-color-choice').forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
  }));
  container.querySelector('[data-room-capacity]')?.addEventListener('change', async (event) => {
    try { await client.configure({ capacity: Number(event.currentTarget.value) }); }
    catch (error) { globalThis.alert?.(error.message); }
  });
  container.querySelector('[data-room-mode]')?.addEventListener('change', async (event) => {
    const mode = event.currentTarget.value;
    const capacity = mode === 'competitive' ? 6 : Math.max(2, Math.min(6, humanCount));
    try { await client.configure({ mode, capacity }); }
    catch (error) { globalThis.alert?.(error.message); }
  });
  container.querySelector('[data-room-start]')?.addEventListener('click', async () => {
    const confirmEarly = needsEarlyStartConfirmation(snapshot);
    if (confirmEarly && !globalThis.confirm?.(snapshot.mode === 'competitive'
      ? 'Ainda há lugares vazios. Se continuar, bots preencherão os assentos da Corrida 3v3. Deseja iniciar?'
      : 'Ainda há lugares vazios. Deseja iniciar a partida com quem já entrou?')) return;
    try { await client.start({ confirmEarly }); }
    catch (error) { globalThis.alert?.(error.message); }
  });
  container.querySelector('[data-room-next]')?.addEventListener('click', async () => {
    try { await client.nextMatch(); }
    catch (error) { globalThis.alert?.(error.message); }
  });
  container.querySelector('[data-room-close]')?.addEventListener('click', async () => {
    if (!globalThis.confirm?.('Encerrar esta sala para todos?')) return;
    try { await client.closeRoom(); onClosed(); }
    catch (error) { globalThis.alert?.(error.message); }
  });
}

const api = {
  RoomClient,
  availableRoomColors,
  needsEarlyStartConfirmation,
  roomShareUrl,
  renderLobby,
  active: null,
  use(client) { this.active = client; return client; },
  nextMatch() { return this.active?.nextMatch(); },
  closeRoom() { return this.active?.closeRoom(); },
};

if (typeof window !== 'undefined') window.RoomClient = api;
export { RoomClient, availableRoomColors, needsEarlyStartConfirmation, roomShareUrl, renderLobby };
