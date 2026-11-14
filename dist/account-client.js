(function () {
  'use strict';

  const LEGACY_STORE_KEY = 'cyberrota-v1';
  const LEGACY_ACTIVE_KEY = 'cyberrota-active-game';
  const LEGACY_GUEST_KEY = 'cyberrota-guest-id';
  const LEGACY_DEVICE_KEY = 'cyberrota-device-id';
  const DEFAULT_PROGRESS = () => ({
    displayName: 'Jogador convidado',
    stats: { total: 0, correct: 0, points: 0, byTheme: {} },
    errors: [], sessions: [], customDecks: [], savedGames: [], usedIds: [],
  });
  const state = {
    account: null,
    progress: null,
    revision: 0,
    clientId: null,
    syncTimer: null,
    syncChain: Promise.resolve(),
    initialized: false,
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const initials = (value) => String(value || 'CR').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'CR';

  function request(path, init = {}) {
    return fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) },
    }).then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.message || 'Não foi possível acessar sua conta.');
        error.code = body.error;
        throw error;
      }
      return body;
    });
  }

  function safeAvatarUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && /(^|\.)googleusercontent\.com$/i.test(url.hostname) ? url.href : '';
    } catch {
      return '';
    }
  }

  function avatarMarkup(account, className = 'account-avatar') {
    const name = account?.displayName || 'Jogador';
    const photo = safeAvatarUrl(account?.avatarUrl);
    return `<span class="${className}" aria-hidden="true">${photo ? `<img class="account-avatar-photo" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer">` : escapeHtml(initials(name))}</span>`;
  }

  function applyProgress(progress) {
    if (!state.account) return;
    const source = progress || {};
    state.revision = Number(source.revision) || 0;
    state.progress = {
      displayName: state.account.displayName || 'Jogador',
      stats: source.stats || DEFAULT_PROGRESS().stats,
      errors: Array.isArray(source.errors) ? source.errors : [],
      sessions: Array.isArray(source.sessions) ? source.sessions : [],
      customDecks: Array.isArray(source.customDecks) ? source.customDecks : [],
      savedGames: Array.isArray(source.savedGames) ? source.savedGames : [],
      usedIds: Array.isArray(source.usedIds) ? source.usedIds : [],
    };
    window.dispatchEvent(new CustomEvent('cyberrota-account-progress', {
      detail: { progress: state.progress, account: state.account },
    }));
  }

  function legacyProgress() {
    let store = {};
    let activeGame = null;
    try {
      store = JSON.parse(localStorage.getItem(LEGACY_STORE_KEY) || '{}');
      activeGame = JSON.parse(localStorage.getItem(LEGACY_ACTIVE_KEY) || 'null');
    } catch {
      return { progress: null, guestId: null, deviceId: null };
    }
    const hasData = !!activeGame || Number(store.stats?.total) > 0 || store.errors?.length || store.sessions?.length || store.customDecks?.length;
    if (!hasData) return { progress: null, guestId: null, deviceId: null };
    let guestId = localStorage.getItem(LEGACY_GUEST_KEY);
    let deviceId = localStorage.getItem(LEGACY_DEVICE_KEY);
    if (!guestId) guestId = crypto.randomUUID();
    if (!deviceId) deviceId = crypto.randomUUID();
    return {
      guestId,
      deviceId,
      progress: {
        displayName: state.account.displayName || 'Jogador',
        stats: store.stats || DEFAULT_PROGRESS().stats,
        errors: Array.isArray(store.errors) ? store.errors : [],
        sessions: Array.isArray(store.sessions) ? store.sessions : [],
        customDecks: Array.isArray(store.customDecks) ? store.customDecks : [],
        activeGame,
        usedIds: Array.isArray(store.usedIds) ? store.usedIds : [],
      },
    };
  }

  function clearLegacyProgress() {
    try {
      [LEGACY_STORE_KEY, LEGACY_ACTIVE_KEY, LEGACY_GUEST_KEY, LEGACY_DEVICE_KEY].forEach((key) => localStorage.removeItem(key));
    } catch { /* Browser storage can be unavailable in private contexts. */ }
  }

  async function init() {
    if (state.initialized) return state;
    state.initialized = true;
    try {
      const config = await request('/api/config');
      state.clientId = config.googleClientId;
      const session = await request('/api/account/me');
      state.account = session.account;
      const saved = await request('/api/account/progress');
      applyProgress(saved.progress);
    } catch (error) {
      state.account = null;
      state.progress = null;
      if (error.code !== 'AUTH_REQUIRED') console.warn('Não foi possível carregar os dados da conta.', error);
    }
    return state;
  }

  function syncLocal(store, activeGame) {
    if (!state.account || !store) return;
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => {
      const source = state.progress || DEFAULT_PROGRESS();
      const progress = {
        displayName: state.account.displayName || source.displayName,
        stats: store.stats || source.stats,
        errors: store.errors || source.errors,
        sessions: store.sessions || source.sessions,
        customDecks: store.customDecks || source.customDecks,
        usedIds: store.usedIds || source.usedIds,
        savedGames: activeGame?.mode === 'solo' && activeGame.phase !== 'finished'
          ? [{ id: 'primary', mode: 'solo', state: activeGame, updatedAt: new Date().toISOString() }]
          : [],
      };
      state.progress = progress;
      state.syncChain = state.syncChain.then(async () => {
        const result = await request('/api/account/progress', {
          method: 'PUT',
          body: JSON.stringify({ progress, revision: state.revision }),
        });
        state.revision = Number(result.progress?.revision) || state.revision + 1;
      }).catch((error) => {
        if (error.code === 'PROGRESS_CONFLICT') window.dispatchEvent(new CustomEvent('cyberrota-account-conflict'));
        else console.warn('Não foi possível sincronizar sua conta agora.', error);
      });
    }, 800);
  }

  async function onGoogleCredential(response) {
    const csrf = await request('/api/account/csrf');
    const result = await request('/api/account/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential, csrfToken: csrf.csrfToken }),
    });
    state.account = result.account;
    const legacy = legacyProgress();
    if (legacy.progress) {
      await request('/api/account/import-guest', {
        method: 'POST',
        body: JSON.stringify({ guestId: legacy.guestId, deviceId: legacy.deviceId, progress: legacy.progress }),
      });
    }
    const live = window.CyberrotaProgress?.();
    const liveStore = live?.store || {};
    const hasLiveProgress = Number(liveStore.stats?.total) > 0
      || liveStore.errors?.length
      || liveStore.sessions?.length
      || liveStore.customDecks?.length
      || live?.activeGame;
    if (hasLiveProgress) {
      await request('/api/account/import-guest', {
        method: 'POST',
        body: JSON.stringify({
          guestId: crypto.randomUUID(),
          deviceId: crypto.randomUUID(),
          progress: {
            displayName: state.account.displayName || 'Jogador',
            stats: liveStore.stats,
            errors: liveStore.errors || [],
            sessions: liveStore.sessions || [],
            customDecks: liveStore.customDecks || [],
            activeGame: live.activeGame ? { mode: live.activeGame.mode, state: live.activeGame } : null,
            usedIds: liveStore.usedIds || [],
          },
        }),
      });
    }
    const saved = await request('/api/account/progress');
    applyProgress(saved.progress);
    clearLegacyProgress();
    renderAccountPanel();
  }

  function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (window.__cyberrotaGoogleScript) return window.__cyberrotaGoogleScript;
    window.__cyberrotaGoogleScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Não foi possível carregar o login Google.'));
      document.head.appendChild(script);
    });
    return window.__cyberrotaGoogleScript;
  }

  function renderPanel(holder) {
    if (!holder) return;
    if (state.account) {
      holder.innerHTML = `<section class="account-panel"><div class="account-panel-title">${avatarMarkup(state.account)}<div><b>${escapeHtml(state.account.displayName)}</b><small>${escapeHtml(state.account.email || 'Conta Google')}</small></div></div><p>Seu progresso e suas partidas ficam salvos na sua conta.</p><div class="account-actions"><button type="button" class="btn btn-secondary" data-account-export>Exportar dados da conta</button><button type="button" class="btn btn-quiet" data-account-logout>Sair</button><button type="button" class="btn btn-danger" data-account-delete>Excluir conta</button></div></section>`;
      holder.querySelector('[data-account-export]')?.addEventListener('click', exportAccount);
      holder.querySelector('[data-account-logout]')?.addEventListener('click', logout);
      holder.querySelector('[data-account-delete]')?.addEventListener('click', deleteAccount);
      return;
    }
    holder.innerHTML = `<section class="account-panel account-signin-panel"><b>Entre com Google</b><p>Seu perfil, progresso e partidas serão salvos na conta. Sem login, nada fica salvo.</p>${state.clientId ? '<div id="google-signin" class="google-signin"></div>' : '<small>O login Google ainda não está configurado.</small>'}</section>`;
    if (!state.clientId) return;
    loadGoogleScript().then(() => {
      const button = holder.querySelector('#google-signin');
      if (!button || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({ client_id: state.clientId, callback: (credential) => onGoogleCredential(credential).catch((error) => window.alert(error.message)) });
      window.google.accounts.id.renderButton(button, { theme: 'filled_blue', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', locale: 'pt_BR', width: 280 });
    }).catch((error) => {
      const target = holder.querySelector('#google-signin');
      if (target) target.textContent = error.message;
    });
  }

  function renderChrome() {
    const name = state.account?.displayName || 'Visitante';
    const nameElement = document.getElementById('profile-name');
    const label = document.querySelector('#profile-button .profile-copy small');
    const syncTitle = document.querySelector('.sync-card b');
    const syncDescription = document.querySelector('.sync-card small');
    const syncCard = document.querySelector('.sync-card');
    const footerLabel = document.getElementById('progress-storage-label');
    if (nameElement) nameElement.textContent = name;
    if (label) label.textContent = state.account ? 'Conta Google' : 'Sem login';
    if (syncTitle) syncTitle.textContent = state.account ? 'Conta conectada' : 'Sem conta conectada';
    if (syncDescription) syncDescription.textContent = state.account ? 'Progresso salvo na conta' : 'Sem login, nada fica salvo';
    if (syncCard) syncCard.classList.toggle('has-account', !!state.account);
    if (footerLabel) footerLabel.textContent = state.account ? 'Progresso salvo na sua conta' : 'Sem login, nada fica salvo';
    document.querySelectorAll('.profile-button .avatar, #profile-shortcut').forEach((element) => {
      const photo = safeAvatarUrl(state.account?.avatarUrl);
      element.innerHTML = photo
        ? `<img class="account-avatar-photo" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer">`
        : escapeHtml(initials(name));
      element.classList.toggle('has-google-avatar', !!photo);
    });
  }

  function renderAccountPanel() {
    renderPanel(document.querySelector('#account-profile-panel'));
    renderChrome();
  }

  async function exportAccount() {
    try {
      const response = await fetch('/api/account/export', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Não foi possível exportar os dados da conta.');
      const blob = await response.blob();
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = 'cyberrota-dados.json';
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function logout() {
    await request('/api/account/logout', { method: 'POST' });
    state.account = null;
    state.progress = null;
    state.revision = 0;
    window.dispatchEvent(new CustomEvent('cyberrota-account-progress', { detail: { progress: null, account: null } }));
    renderAccountPanel();
  }

  async function deleteAccount() {
    if (!window.confirm('Excluir permanentemente sua conta e todos os dados sincronizados? Sem login, o jogo não salvará novos dados.')) return;
    await request('/api/account', { method: 'DELETE' });
    state.account = null;
    state.progress = null;
    state.revision = 0;
    window.dispatchEvent(new CustomEvent('cyberrota-account-progress', { detail: { progress: null, account: null } }));
    renderAccountPanel();
  }

  window.AccountClient = { state, init, syncLocal, applyProgress, renderPanel, renderAccountPanel, renderChrome, exportAccount, safeAvatarUrl, completeGoogleLogin: onGoogleCredential };
})();
