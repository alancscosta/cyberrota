const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../dist/account-client.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');

function createClient({ account = null, loginAccount = null, progress = null, google = null, liveProgress = null } = {}) {
  const requests = [];
  const listeners = new Map();
  let currentAccount = account;
  const holder = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '#google-signin') return { textContent: '', id: 'google-signin' };
      return null;
    },
    addEventListener() {},
  };
  const document = {
    querySelector(selector) { return selector === '#account-profile-panel' ? holder : null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    addEventListener(type, handler) { listeners.set(type, handler); },
    createElement() { return { set src(value) { this.source = value; }, set async(_) {}, set defer(_) {} }; },
    head: { appendChild() {} },
  };
  const fetch = async (path, init = {}) => {
    requests.push({ path, init });
    if (path === '/api/config') return response({ googleClientId: google ? 'google-client' : null });
    if (path === '/api/account/me') return currentAccount ? response({ account: currentAccount }) : response({ error: 'AUTH_REQUIRED', message: 'Entre com Google.' }, 401);
    if (path === '/api/account/progress') return response({ progress: progress || {} });
    if (path === '/api/account/csrf') return response({ csrfToken: 'csrf' });
    if (path === '/api/account/google') {
      currentAccount = loginAccount || account;
      return response({ account: currentAccount });
    }
    return response({ progress: { revision: 1 } });
  };
  const window = {
    google,
    CyberrotaProgress: () => liveProgress,
    addEventListener(type, handler) { listeners.set(`window:${type}`, handler); },
    dispatchEvent() {},
    alert() {},
    confirm() { return true; },
  };
  const context = {
    window,
    document,
    fetch,
    console,
    crypto: { randomUUID: () => 'device-id' },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    localStorage: {
      getItem() { throw new Error('localStorage must not be used for progress'); },
      setItem() { throw new Error('localStorage must not be used for progress'); },
      removeItem() { throw new Error('localStorage must not be used for progress'); },
    },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    URL,
    Blob,
  };
  vm.runInNewContext(source, context, { filename: 'account-client.js' });
  return { client: window.AccountClient, holder, requests, listeners };
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return body; } };
}

test('the main app does not persist profile or game progress in browser storage', () => {
  assert.doesNotMatch(appSource, /localStorage/);
});

test('visitor mode does not create a guest session or read/write browser progress', async () => {
  const { client, holder, requests } = createClient();
  await client.init();
  client.renderPanel(holder);

  assert.equal(client.state.account, null);
  assert.equal(requests.some((request) => request.path === '/api/account/guest'), false);
  assert.equal(requests.some((request) => request.path === '/api/account/progress'), false);
  assert.match(holder.innerHTML, /entre com Google/i);
});

test('signed-in progress is loaded from the account API and renders the Google avatar', async () => {
  const account = { id: 'account-1', displayName: 'Ana', email: 'ana@example.com', avatarUrl: 'https://lh3.googleusercontent.com/avatar.png' };
  const { client, holder, requests } = createClient({ account, progress: { displayName: 'Ana', stats: { total: 4 }, errors: [], sessions: [], customDecks: [] } });
  await client.init();
  client.renderPanel(holder);

  assert.equal(client.state.account.avatarUrl, account.avatarUrl);
  assert.ok(requests.some((request) => request.path === '/api/account/progress'));
  assert.ok(holder.innerHTML.includes('<img class="account-avatar-photo" src="https://lh3.googleusercontent.com/avatar.png"'));
});

test('signed-in progress is written only through the account API', async () => {
  const account = { id: 'account-1', displayName: 'Ana', email: 'ana@example.com', avatarUrl: '' };
  const { client, requests } = createClient({ account, progress: { revision: 2 } });
  await client.init();
  client.syncLocal({
    stats: { total: 1, correct: 1, points: 2, byTheme: {} },
    errors: [], sessions: [], customDecks: [], usedIds: [],
  }, { mode: 'solo', phase: 'walk' });
  await client.state.syncChain;

  const write = requests.find((request) => request.path === '/api/account/progress' && request.init.method === 'PUT');
  assert.ok(write);
  const body = JSON.parse(write.init.body);
  assert.equal(body.progress.stats.total, 1);
  assert.equal(body.progress.savedGames[0].id, 'primary');
  assert.equal(requests.some((request) => request.path === '/api/account/guest'), false);
});

test('logging in imports the current in-memory visitor session into the account', async () => {
  const account = { id: 'account-2', displayName: 'Bia', email: 'bia@example.com', avatarUrl: '' };
  const liveProgress = {
    store: {
      profile: 'Visitante', stats: { total: 2, correct: 1, points: 1, byTheme: {} },
      errors: [{ id: 'error-1' }], sessions: [], customDecks: [], usedIds: ['q1'],
    },
    activeGame: { mode: 'solo', phase: 'walk', turns: 2 },
  };
  const { client, requests } = createClient({ google: {}, loginAccount: account, liveProgress });
  await client.init();
  await client.completeGoogleLogin({ credential: 'google-token' });

  const imported = requests.find((request) => request.path === '/api/account/import-guest');
  assert.ok(imported);
  const body = JSON.parse(imported.init.body);
  assert.equal(body.progress.stats.total, 2);
  assert.equal(body.progress.errors[0].id, 'error-1');
  assert.equal(body.progress.activeGame.state.phase, 'walk');
});

test('Google button uses a dark-compatible filled theme', async () => {
  let options;
  const google = { accounts: { id: { initialize() {}, renderButton(_holder, value) { options = value; } } } };
  const { client, holder } = createClient({ google });
  await client.init();
  client.renderPanel(holder);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(options.theme, 'filled_blue');
  assert.equal(options.shape, 'rectangular');
  assert.equal(options.locale, 'pt_BR');
});
