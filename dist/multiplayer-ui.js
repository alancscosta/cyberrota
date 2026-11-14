import { RoomClient, renderLobby } from './room-client.js';
import { onlineBoardMarkup } from './online-board.js';

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

function currentPlayer(snapshot, client) {
  return snapshot?.players?.find((player) => player.playerId === client.player?.playerId) || null;
}

function playerPawn(player) {
  const color = colors[Number(player?.colorIndex) || 0];
  return `<span class="online-pawn" style="--pawn-color:${color}">${esc((player?.name || '?').slice(0,1).toUpperCase())}</span>`;
}

function livePlayers(snapshot) {
  const metrics = new Map((snapshot.gameState?.players || []).map((player) => [player.playerId, player]));
  return (snapshot.players || []).map((player, seat) => ({ ...player, ...(metrics.get(player.playerId) || {}), seat }));
}

function gameMarkup(snapshot, client) {
  const game = snapshot.gameState || {};
  const player = currentPlayer(snapshot, client);
  const active = snapshot.players?.find((entry) => entry.playerId === game.currentPlayerId);
  const myTurn = player && game.currentPlayerId === player.playerId;
  const card = game.question;
  const feedback = game.feedback;
  const rollButton = (phase, label) => `<button class="room-primary-button" data-game-action="game.roll" ${!myTurn ? 'disabled' : ''}>${label}</button>`;
  let center = '';
  if (game.phase === 'walk') { const healNodes = (game.coop?.healingNodes || []).filter((node, index) => !node.used && window.GameCore?.HEALING_SPACES?.[index] === game.coop?.position && Object.values(game.coop?.servers || {}).some((hp) => hp < 100)); center = `<h2>Avance pela rede</h2><p>${myTurn ? 'É sua vez. Role o dado para começar.' : `Vez de ${esc(active?.name || 'outro jogador')}.`}</p>${rollButton('walk', 'Rolar dado')}${myTurn && healNodes.map((node) => `<button class="room-secondary-button" data-game-action="game.heal" data-nodeid="${node.id}">Usar nó de cura</button>`).join('')}<div class="online-network-stats">${Object.entries(game.coop?.servers || {}).map(([name, hp]) => `<span>${esc(name)} · ${hp}</span>`).join('')}</div>`; }
  else if (game.phase === 'choose-difficulty') center = `<h2>Escolha a dificuldade</h2><p>Seu avanço foi ${Number(game.coopRoll) || '…'}. Uma pergunta mais difícil vale mais pontos.</p><div class="online-choice-row">${[1,2,3].map((difficulty) => `<button data-game-action="game.choose-difficulty" data-difficulty="${difficulty}" ${!myTurn ? 'disabled' : ''}>${['','Fácil · 1 ponto','Médio · 2 pontos','Difícil · 3 pontos'][difficulty]}</button>`).join('')}</div>`;
  else if (game.phase === 'race-roll') center = `<h2>Corrida de pacotes</h2><p>${myTurn ? 'É sua vez. Role o dado para revelar a pergunta.' : `Vez de ${esc(active?.name || 'outro jogador')}.`}</p>${rollButton('race-roll', 'Rolar dado')}`;
  else if (game.phase === 'question' && card) center = renderQuestion(card, myTurn);
  else if (['feedback','race-feedback','race-shutdown'].includes(game.phase) && feedback) center = `<h2>${feedback.correct ? 'Resposta correta!' : 'Resposta incorreta'}</h2><p>${esc(feedback.answer || '')}</p><p>${esc(feedback.card?.explanation || '')}</p><button class="room-primary-button" data-game-action="game.continue" ${!myTurn && snapshot.hostPlayerId !== player?.playerId ? 'disabled' : ''}>Continuar</button>`;
  else if (game.phase === 'finished') return renderPodium(snapshot, client);
  else center = `<h2>Partida em andamento</h2><p>${myTurn ? 'Sua vez.' : `Aguardando ${esc(active?.name || 'outro jogador')}.`}</p>`;
  const isRace = snapshot.mode === 'competitive';
  const roster = livePlayers(snapshot).map((entry) => `<li>${playerPawn(entry)}<span>${esc(entry.name)}${entry.playerId === game.currentPlayerId ? ' · vez' : ''}</span><b>${Number(entry.score)||0}</b></li>`).join('');
  const map = onlineBoardMarkup(snapshot, colors, esc);
  const progress = isRace ? `TURNO ${Number(game.race?.turn || 0) + 1}/${Number(game.race?.maxTurns || 60)}` : `RODADA ${Number(game.coop?.round || 1)}/${Number(game.coop?.maxRounds || 24)} · HACKER ${Number(game.coop?.hackerHp) || 0} PV`;
  const stats = isRace ? `<div class="online-network-stats"><span>Azul · ${game.race?.teams?.blue?.positions?.filter((position) => position >= 18).length || 0}/3 no estande</span><span>Vermelho · ${game.race?.teams?.red?.positions?.filter((position) => position <= 0).length || 0}/3 no estande</span></div>` : `<div class="online-network-stats">${Object.entries(game.coop?.servers || {}).map(([name, hp]) => `<span>${esc(name)} · ${hp}%</span>`).join('')}</div>`;
  return `<div class="game-world online-board-world ${isRace ? 'race-board-world' : 'cooperative'}"><header class="game-hud"><div class="hud-brand"><img class="game-brand-logo" src="assets/cyberrota-logo.svg" alt="Cyber Rota"><span class="game-brand-mode"><small>${isRace ? 'DESLIGUE O SERVIDOR · 3V3' : 'DEFENDA A REDE · COOPERATIVO'}</small><small>SALA ${esc(snapshot.code)}</small></span></div><div class="hud-center"><span class="round-badge">${progress}</span></div><span class="online-turn-pill">${esc(active?.name || 'Aguardando')}</span></header><div class="game-layout"><section class="world-stage"><div class="world-title"><span>${isRace ? 'ROTA ATÉ O SERVIDOR RIVAL' : 'PROTEJA OS SERVIDORES · DERROTE O HACKER'}</span><b>${esc(active?.name || 'Aguardando jogador')}</b></div><div class="online-board-map-wrap">${map}</div><div class="world-footer"><span>⌖ ROTA DA REDE</span><span>${isRace ? '6 PEÕES · CORRIDA 3V3' : `CASA ${Number(game.coop?.position || 0)}/18`}</span><span>${esc(snapshot.code)}</span></div></section><aside class="game-control-dock"><div class="dock-top"><div><small>${isRace ? 'EQUIPES ONLINE' : 'EQUIPE DE DEFESA'}</small><h1>Jogadores</h1></div><span class="dock-live"><i></i> AO VIVO</span></div><ul class="online-fullscreen-roster">${roster}</ul>${stats}<section class="game-card online-turn-card"><div class="eyebrow">${myTurn ? 'SUA VEZ' : `VEZ DE ${esc(active?.name || 'OUTRO JOGADOR')}`}</div>${center}</section></aside></div></div>`;
}

function renderQuestion(card, myTurn) {
  const options = Array.isArray(card.options) ? card.options : [];
  if (card.type === 'fill' || card.type === 'subnet') return `<form data-online-answer><h2>${esc(card.question || card.prompt)}</h2><label>Sua resposta<input name="answer" autocomplete="off" ${myTurn ? '' : 'disabled'}></label><button class="room-primary-button" ${myTurn ? '' : 'disabled'}>Responder</button></form>`;
  if (card.type === 'order') return `<form data-online-answer data-answer-order><h2>${esc(card.question || card.prompt)}</h2><label>Ordem (separe os itens por vírgula)<input name="answer" ${myTurn ? '' : 'disabled'} placeholder="${esc(options.join(', '))}"></label><button class="room-primary-button" ${myTurn ? '' : 'disabled'}>Responder</button></form>`;
  return `<form data-online-answer><h2>${esc(card.question || card.prompt)}</h2><div class="online-answer-options">${options.map((option, index) => `<label><input type="radio" name="answer" value="${index}" ${myTurn ? '' : 'disabled'}><span>${esc(option)}</span></label>`).join('')}</div><button class="room-primary-button" ${myTurn ? '' : 'disabled'}>Responder</button></form>`;
}

function renderPodium(snapshot, client) {
  const players = livePlayers(snapshot).filter((player) => !player.isBot);
  const podium = window.GameCore?.rankPodium(players) || players.slice(0, 3);
  const places = ['1º','2º','3º'];
  const hostActions = snapshot.hostPlayerId === client.player?.playerId ? '<div class="room-lobby-actions"><button class="room-primary-button" data-room-next>Próxima partida</button><button class="room-danger-button" data-room-close>Encerrar sala</button></div>' : '<p class="room-waiting">Aguardando o anfitrião escolher a próxima ação.</p>';
  return `<section class="online-podium"><span class="room-eyebrow">PARTIDA ENCERRADA · SALA ${esc(snapshot.code)}</span><h1>Placar final</h1><p>Acertos em questões difíceis valem mais pontos. Empates são resolvidos por acertos e depois por menos erros.</p><ol>${podium.map((entry, index) => `<li class="podium-place podium-place-${index+1}">${playerPawn(entry)}<span class="podium-place-copy"><b>${places[index]} · ${esc(entry.name)}</b><small>${entry.points} pts · ${entry.correctAnswers} acertos · ${entry.wrongAnswers} erros</small></span></li>`).join('') || '<li>Não houve participantes humanos nesta partida.</li>'}</ol>${hostActions}</section>`;
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
  if (snapshot.status === 'playing') { gameSurfaceActive = true; modalRoot.innerHTML = ''; document.body.classList.add('in-game'); appRoot.innerHTML = gameMarkup(snapshot, client); bindGame(appRoot, client); return; }
  if (snapshot.status === 'finished') { gameSurfaceActive = true; modalRoot.innerHTML = ''; document.body.classList.add('in-game'); appRoot.innerHTML = `<div class="game-world online-finish-world"><header class="game-hud"><span class="game-brand-mode"><small>PARTIDA ENCERRADA · SALA ${esc(snapshot.code)}</small></span></header><main class="online-finish-content">${renderPodium(snapshot, client)}</main></div>`; bindLobbyActions(appRoot, client); return; }
  if (snapshot.status === 'closed') { client.destroy(); window.RoomClient.active = null; history.replaceState(null, '', location.pathname); if (gameSurfaceActive) { gameSurfaceActive = false; document.body.classList.remove('in-game'); modalRoot.innerHTML = ''; appRoot.innerHTML = `<section class="room-lobby online-room-closed"><p class="room-helper">A sala ${esc(snapshot.code)} foi encerrada.</p><button class="room-primary-button" data-room-home>Voltar ao painel</button></section>`; appRoot.querySelector('[data-room-home]')?.addEventListener('click', () => location.reload()); } else root.innerHTML = `<p class="room-helper">A sala ${esc(snapshot.code)} foi encerrada pelo anfitrião.</p>`; return; }
  if (gameSurfaceActive) { modalRoot.innerHTML = ''; document.body.classList.remove('in-game'); renderLobby(appRoot, snapshot, client.player?.playerId, client, { onClosed: () => renderActive(root, client) }); bindLobbyActions(appRoot, client); return; }
  renderLobby(root, snapshot, client.player?.playerId, client, { onClosed: () => renderActive(root, client) });
}

function bindLobbyActions(root, client) {
  root.querySelector('[data-room-next]')?.addEventListener('click', async () => { try { await client.nextMatch(); } catch (error) { alert(error.message); } });
  root.querySelector('[data-room-close]')?.addEventListener('click', async () => { if (!confirm('Encerrar esta sala para todos?')) return; try { await client.closeRoom(); } catch (error) { alert(error.message); } });
}

function bindGame(root, client) {
  root.querySelectorAll('[data-game-action]').forEach((button) => button.addEventListener('click', async () => {
    try { const payload = button.dataset.difficulty ? { difficulty: Number(button.dataset.difficulty) } : button.dataset.nodeid ? { nodeId: Number(button.dataset.nodeid) } : {}; await client.command(button.dataset.gameAction, payload); }
    catch (error) { alert(error.message); }
  }));
  root.querySelector('[data-online-answer]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const selected = form.querySelector('input[type="radio"]:checked'); const input = form.elements.answer;
    if (!selected && !input?.value.trim()) return;
    let answer = selected ? Number(selected.value) : input.value.trim();
    if (form.hasAttribute('data-answer-order')) answer = answer.split(',').map((part) => part.trim());
    try { await client.command('game.answer', { answer }); } catch (error) { alert(error.message); }
  });
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
      if (error.newCode) { joinForm.elements.code.value = error.newCode; errorBox.textContent = `O anfitrião trocou o código. O código novo é ${error.newCode}; tente entrar novamente.`; }
      else errorBox.textContent = error.message;
    }
  });
  const initialCode = readSavedCode();
  if (initialCode && CODE.test(initialCode)) {
    const saved = new RoomClient({ code: initialCode });
    if (saved.savedPlayer()) {
      window.RoomClient.use(saved);
      saved.resume().then((result) => { saved.snapshot = result.snapshot; renderActive(root, saved); }).catch(() => { window.RoomClient.active = null; });
    }
  }
}

export { launchMarkup, gameMarkup, renderQuestion, renderPodium, mount };
if (typeof window !== 'undefined') {
  window.CyberrotaRooms = { mount };
  window.dispatchEvent(new Event('cyberrota:rooms-ready'));
}
