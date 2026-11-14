const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../dist/account-client.js'), 'utf8');

function createClient({ account = null, progress = null, google = null } = {}) {
  const requests = [];
  const listeners = new Map();
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
    addEventListener(type, handler) { listeners.set(type, handler); },
    createElement() { return { set src(value) { this.source = value; }, set async(_) {}, set defer(_) {} }; },
    head: { appendChild() {} },
  };
  const fetch = async (path, init = {}) => {
    requests.push({ path, init });
    if (path === '/api/config') return response({ googleClientId: google ? 'google-client' : null });
    if (path === '/api/account/me') return account ? response({ account }) : response({ error: 'AUTH_REQUIRED', message: 'Entre com Google.' }, 401);
    if (path === '/api/account/progress') return response({ progress: progress || {} });
    return response({ progress: { revision: 1 } });
  };
  const window = {
    google,
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

test('Google button uses a dark-compatible filled theme', async () => {
  let options;
  const google = { accounts: { id: { initialize() {}, renderButton(_holder, value) { options = value; } } } };
  const { client, holder } = createClient({ google });
  await client.init();
  client.renderPanel(holder);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(options.theme, 'filled_blue');
});
