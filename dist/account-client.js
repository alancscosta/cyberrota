(function () {
  'use strict';
  const GUEST_KEY = 'cyberrota-guest-id';
  const DEVICE_KEY = 'cyberrota-device-id';
  const ACTIVE_KEY = 'cyberrota-active-game';
  const STORE_KEY = 'cyberrota-v1';
  const state = { account: null, guestId: null, revision: 0, clientId: null, syncTimer: null, syncChain: Promise.resolve(), initialized: false };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const getId = (key) => {
    let value = localStorage.getItem(key);
    if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
    return value;
  };

  async function request(path, init = {}) {
    const response = await fetch(path, { credentials: 'same-origin', ...init, headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(body.message || 'Não foi possível acessar sua conta.'); error.code = body.error; throw error; }
    return body;
  }

  function localProgress(store) {
    let activeGame = null;
    try { activeGame = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { /* partida corrompida não bloqueia o backup */ }
    return {
      displayName: store.profile || 'Jogador convidado', stats: store.stats || {}, errors: store.errors || [],
      sessions: store.sessions || [], customDecks: store.customDecks || [], savedGames: [],
      activeGame, usedIds: store.usedIds || [],
    };
  }

  function applyProgress(progress) {
    if (!progress) return;
    state.revision = Number(progress.revision) || 0;
    const current = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const next = {
      ...current,
      profile: progress.displayName || current.profile || 'Jogador convidado',
      stats: progress.stats || current.stats || { total: 0, correct: 0, points: 0, byTheme: {} },
      errors: progress.errors || [], sessions: progress.sessions || [], customDecks: progress.customDecks || [], usedIds: progress.usedIds || [],
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    const latestSolo = (progress.savedGames || []).filter((game) => game.mode === 'solo').sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
    if (latestSolo?.state) localStorage.setItem(ACTIVE_KEY, JSON.stringify({ version: 1, state: latestSolo.state }));
    else if (!localStorage.getItem(ACTIVE_KEY)) localStorage.removeItem(ACTIVE_KEY);
    window.dispatchEvent(new CustomEvent('cyberrota-account-progress', { detail: { progress: next, account: state.account } }));
  }

  async function ensureGuestSession() {
    state.guestId = getId(GUEST_KEY);
    const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    await request('/api/account/guest', { method: 'POST', body: JSON.stringify({ guestId: state.guestId, displayName: store.profile || 'Jogador convidado' }) });
  }

  async function init() {
    if (state.initialized) return state;
    state.initialized = true;
    state.guestId = getId(GUEST_KEY);
    getId(DEVICE_KEY);
    try {
      const config = await request('/api/config');
      state.clientId = config.googleClientId;
      const session = await request('/api/account/me');
      state.account = session.account;
      const saved = await request('/api/account/progress');
      applyProgress(saved.progress);
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        try { await ensureGuestSession(); } catch { /* o app segue disponível em modo local */ }
      }
    }
    return state;
  }

  function syncLocal(store) {
    if (!state.account || !store) return;
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => {
      const progress = localProgress(store);
      state.syncChain = state.syncChain.then(async () => {
        const result = await request('/api/account/progress', { method: 'PUT', body: JSON.stringify({ progress, revision: state.revision }) });
        state.revision = Number(result.progress?.revision) || state.revision + 1;
      }).catch((error) => {
        if (error.code === 'PROGRESS_CONFLICT') window.dispatchEvent(new CustomEvent('cyberrota-account-conflict'));
        else console.warn('Não foi possível sincronizar a conta agora.', error);
      });
    }, 800);
  }

  async function onGoogleCredential(response) {
    const csrf = await request('/api/account/csrf');
    const result = await request('/api/account/google', { method: 'POST', body: JSON.stringify({ credential: response.credential, csrfToken: csrf.csrfToken }) });
    state.account = result.account;
    const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    await request('/api/account/import-guest', { method: 'POST', body: JSON.stringify({ guestId: state.guestId || getId(GUEST_KEY), deviceId: getId(DEVICE_KEY), progress: localProgress(store) }) });
    const saved = await request('/api/account/progress');
    applyProgress(saved.progress);
    renderAccountPanel();
  }

  function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (window.__cyberrotaGoogleScript) return window.__cyberrotaGoogleScript;
    window.__cyberrotaGoogleScript = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true;
      script.onload = resolve; script.onerror = () => reject(new Error('Não foi possível carregar o login Google.'));
      document.head.appendChild(script);
    });
    return window.__cyberrotaGoogleScript;
  }

  function renderPanel(holder) {
    if (!holder) return;
    if (state.account) {
      holder.innerHTML = `<section class="account-panel"><div class="account-panel-title"><span class="account-avatar">${escapeHtml((state.account.displayName || 'J').slice(0, 1).toUpperCase())}</span><div><b>${escapeHtml(state.account.displayName)}</b><small>${escapeHtml(state.account.email || 'Conta Cyber Rota')}</small></div></div><p>Seu progresso está sincronizado com sua conta.</p><div class="account-actions"><button type="button" class="btn btn-secondary" data-account-export>Exportar dados da conta</button><button type="button" class="btn btn-quiet" data-account-logout>Sair</button><button type="button" class="btn btn-danger" data-account-delete>Excluir conta</button></div></section>`;
      holder.querySelector('[data-account-export]')?.addEventListener('click', exportAccount);
      holder.querySelector('[data-account-logout]')?.addEventListener('click', logout);
      holder.querySelector('[data-account-delete]')?.addEventListener('click', deleteAccount);
      return;
    }
    holder.innerHTML = `<section class="account-panel"><b>Salve seu progresso em outros dispositivos</b><p>Você pode continuar como convidado sem criar uma conta. Ao entrar com Google, seu progresso local será importado uma vez.</p>${state.clientId ? '<div id="google-signin" class="google-signin"></div>' : '<small>Login Google será ativado quando o app receber a configuração OAuth.</small>'}</section>`;
    if (!state.clientId) return;
    loadGoogleScript().then(() => {
      const button = holder.querySelector('#google-signin');
      if (!button || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({ client_id: state.clientId, callback: (response) => onGoogleCredential(response).catch((error) => window.alert(error.message)) });
      window.google.accounts.id.renderButton(button, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 280 });
    }).catch((error) => { const target = holder.querySelector('#google-signin'); if (target) target.textContent = error.message; });
  }

  function renderAccountPanel() {
    renderPanel(document.querySelector('#account-profile-panel'));
    const label = document.querySelector('#profile-button .profile-copy small');
    if (label) label.textContent = state.account ? 'Conta sincronizada' : 'Perfil local';
  }

  async function exportAccount() {
    try {
      const response = await fetch('/api/account/export', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Não foi possível exportar os dados.');
      const blob = await response.blob(); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'cyberrota-dados.json'; anchor.click(); URL.revokeObjectURL(anchor.href);
    } catch (error) { window.alert(error.message); }
  }

  async function logout() {
    await request('/api/account/logout', { method: 'POST' });
    state.account = null; state.revision = 0; await ensureGuestSession(); renderAccountPanel();
  }

  async function deleteAccount() {
    if (!window.confirm('Excluir permanentemente sua conta e os dados sincronizados? O progresso que já está neste navegador continuará salvo aqui.')) return;
    await request('/api/account', { method: 'DELETE' });
    state.account = null; state.revision = 0; await ensureGuestSession(); renderAccountPanel();
  }

  window.AccountClient = { state, init, syncLocal, localProgress, renderPanel, exportAccount, applyProgress };
  window.addEventListener('DOMContentLoaded', () => { init().then(renderAccountPanel); });
})();
