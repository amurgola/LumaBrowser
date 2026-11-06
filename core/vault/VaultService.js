const crypto = require('crypto');
const VaultStore = require('./VaultStore');
const VaultSites = require('./VaultSites');
const VaultCsv = require('./VaultCsv');
const PasswordGenerator = require('./PasswordGenerator');
const AutofillFields = require('./AutofillFields');
const VaultLock = require('./VaultLock');
const VaultRedactor = require('./VaultRedactor');
const VaultAgentAccess = require('./VaultAgentAccess');
const VaultAudit = require('./VaultAudit');
const Totp = require('./Totp');

class VaultService {
  static OFFER_KEY = 'core.vault.offerToSave';
  static NEVER_KEY = 'core.vault.neverSave';
  static OFFER_ADDRESSES_KEY = 'core.vault.offerAddresses';
  static PROMPT_TIMEOUT_MS = 3 * 60 * 1000;
  static USERNAME_MEMORY_MS = 10 * 60 * 1000;
  static MAX_FIELD = 512;

  constructor({ db, getTabViewManager, store = null, now = () => Date.now() }) {
    this._db = db;
    this._tvm = getTabViewManager || (() => null);
    this._store = store || new VaultStore(db, { now });
    this._lock = new VaultLock(db, { now });
    this.redactor = new VaultRedactor(() => this.secrets());
    this.audit = new VaultAudit(db, { now });
    this._audit = (entry) => this.audit.record(entry);
    this.agent = new VaultAgentAccess({ vault: this, db, audit: (entry) => this._audit(entry) });
    this._now = now;
    this._prompts = new Map();
    this._pendingUsers = new Map();
  }

  get store() { return this._store; }


  status() {
    return {
      ...this._store.status(),
      offerToSave: this.offerToSave(),
      offerAddresses: this.offerAddresses(),
      lock: this._lock.state(),
      allowExternal: this.agent.allowExternal(),
      profileFields: AutofillFields.KEYS.map((key) => ({ key, label: AutofillFields.LABELS[key] })),
    };
  }

  offerAddresses() {
    try { return this._db.get(VaultService.OFFER_ADDRESSES_KEY, true) !== false; } catch (_) { return true; }
  }

  setOfferAddresses(on) {
    this._db.set(VaultService.OFFER_ADDRESSES_KEY, !!on);
    return !!on;
  }

  offerToSave() {
    try { return this._db.get(VaultService.OFFER_KEY, true) !== false; } catch (_) { return true; }
  }

  setOfferToSave(on) {
    this._db.set(VaultService.OFFER_KEY, !!on);
    return !!on;
  }

  neverList() {
    const list = this._db.get(VaultService.NEVER_KEY, []);
    return Array.isArray(list) ? list.slice().sort() : [];
  }

  removeNever(origin) {
    this._db.set(VaultService.NEVER_KEY, this.neverList().filter((o) => o !== origin));
    return { success: true };
  }

  list() {
    return this._store.all().map((item) => VaultService._redact(item));
  }

  reveal(id) {
    const locked = this.lockedError();
    if (locked) return locked;
    const item = this._store.get(String(id || ''));
    if (!item) return { success: false, error: 'Not found' };
    this._lock.touch();
    if (item.type === 'key') return { success: true, password: item.value };
    return { success: true, password: item.password, totp: item.totp || '' };
  }


  isLocked() { return !this._lock.isUnlocked(); }


  tabUrl(tabId) {
    const tab = this._tabById(tabId);
    return tab ? tab.url : null;
  }

  activeTabId() {
    const tvm = this._tvm();
    const id = tvm && typeof tvm.getActiveTabId === 'function' ? tvm.getActiveTabId() : null;
    return id == null ? null : id;
  }

  describeCall(params) {
    const info = this.agent.describe(params && params.ref);
    if (!info) return null;
    const tabId = params && params.tabId != null ? Number(params.tabId) : this.activeTabId();
    return { ...info, tabHost: VaultSites.hostOf(this.tabUrl(tabId)) };
  }

  setAudit(record) { this._audit = typeof record === 'function' ? record : (entry) => this.audit.record(entry); }

  touchLock() { this._lock.touch(); }

  lockedError() {
    return this.isLocked() ? { success: false, locked: true, error: 'Unlock with your master password first' } : null;
  }

  unlock(password) { return this._lock.unlock(password); }

  lockNow() { this._lock.lock(); return { success: true }; }

  setMasterPassword(current, next) { return this._lock.setPassword(current, next); }

  removeMasterPassword(current) { return this._lock.remove(current); }

  setAutoLockMinutes(minutes) { return this._lock.setIdleMinutes(minutes); }

  secrets() {
    if (this._store.status().unreadable) return [];
    const out = [];
    for (const i of this._store.all()) {
      const name = i.title || VaultSites.hostOf(i.origin) || i.type;
      if (i.type === 'login' && i.password) out.push({ value: i.password, name });
      if (i.type === 'login' && i.totp) out.push({ value: i.totp, name: `${name} 2FA` });
      if (i.type === 'key' && i.value) out.push({ value: i.value, name: VaultStore.slug(i.title) || name });
    }
    return out;
  }

  totpCode(id) {
    const locked = this.lockedError();
    if (locked) return locked;
    const item = this._store.get(String(id || ''));
    const res = item && item.type === 'login' ? Totp.code(item.totp) : null;
    if (!res) return { success: false, error: 'This login has no usable two-factor secret' };
    this._lock.touch();
    return { success: true, code: res.code, secondsLeft: res.secondsLeft };
  }

  fillOtp(tabId, itemId) {
    const tab = this._tabById(tabId);
    if (!tab) return { success: false, error: 'No such tab' };
    const item = this._store.get(String(itemId || ''));
    if (!item || item.type !== 'login') return { success: false, error: 'Not found' };
    if (!VaultSites.match(item.origin, tab.url)) return { success: false, error: 'This login belongs to another site' };
    const res = Totp.code(item.totp);
    if (!res) return { success: false, error: 'This login has no usable two-factor secret' };
    VaultService._send(tab.webContents, 'vault:do-fill', { otp: res.code });
    return { success: true };
  }

  save(fields) {
    const f = fields || {};
    if (f.type === 'profile') return this._saveProfile(f);
    if (f.type === 'key') return this._saveKey(f);
    if (f.aiAccess || (f.id && f.password != null)) {
      const locked = this.lockedError();
      if (locked) return locked;
    }
    if (!VaultSites.normalizeOrigin(f.origin)) return { success: false, error: 'Enter the site address, like example.com' };
    if (!f.password) return { success: false, error: 'Enter a password' };
    if (f.totp && !Totp.parse(f.totp)) return { success: false, error: 'The two-factor secret is not a valid base32 key or otpauth:// link' };
    const data = { type: 'login', origin: f.origin, username: f.username, password: f.password, title: f.title, notes: f.notes, aiAccess: f.aiAccess === true };
    if (f.totp != null) data.totp = String(f.totp).trim();
    try {
      const item = f.id ? this._store.update(String(f.id), data) : this._store.add(data);
      return item ? { success: true, item: VaultService._redact(item) } : { success: false, error: 'Not found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _saveKey(f) {
    const locked = this.lockedError();
    if (locked) return locked;
    const slug = VaultStore.slug(f.title);
    if (!slug) return { success: false, error: 'Name the key, like openai or github-token' };
    if (!f.value && !f.id) return { success: false, error: 'Enter the key' };
    const clash = this._store.all().find((i) => i.type === 'key' && i.id !== f.id && VaultStore.slug(i.title) === slug);
    if (clash) return { success: false, error: `A key named ${slug} already exists` };
    const data = { type: 'key', title: String(f.title).trim(), notes: f.notes, aiAccess: f.aiAccess === true };
    if (f.value) data.value = String(f.value);
    try {
      const item = f.id ? this._store.update(String(f.id), data) : this._store.add(data);
      return item ? { success: true, item: VaultService._redact(item) } : { success: false, error: 'Not found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _saveProfile(f) {
    if (f.aiAccess && this.isLocked()) return this.lockedError();
    const data = { type: 'profile', title: String(f.title || '').trim(), aiAccess: f.aiAccess === true, ...AutofillFields.clean(f) };
    if (Object.keys(data).length <= 3) return { success: false, error: 'Fill in at least one field' };
    try {
      const item = f.id ? this._store.update(String(f.id), data) : this._store.add(data);
      return item ? { success: true, item: VaultService._redact(item) } : { success: false, error: 'Not found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  remove(id) {
    try { return { success: this._store.remove(String(id || '')) }; } catch (err) { return { success: false, error: err.message }; }
  }

  importCsv(text) {
    const { logins, skipped } = VaultCsv.read(text);
    const fresh = [];
    let updated = 0;
    let duplicates = 0;
    for (const login of logins) {
      const origin = VaultSites.normalizeOrigin(login.origin);
      if (!origin) { duplicates++; continue; }
      const existing = this._store.findLogin(origin, login.username) || fresh.find((f) => f.origin === origin && f.username === login.username);
      if (!existing) { fresh.push({ ...login, origin, type: 'login' }); continue; }
      if (existing.password === login.password) { duplicates++; continue; }
      if (existing.id) { this._store.update(existing.id, { password: login.password }); updated++; } else { existing.password = login.password; }
    }
    const added = fresh.length ? this._store.addMany(fresh) : 0;
    return { success: true, added, updated, skipped: skipped + duplicates };
  }

  exportCsv() {
    const locked = this.lockedError();
    if (locked) throw new Error(locked.error);
    return VaultCsv.write(this._store.all().filter((i) => i.type === 'login'));
  }

  generate() {
    return PasswordGenerator.generate();
  }


  attachTabs(tvm) {
    if (!tvm || typeof tvm.on !== 'function') return;
    tvm.on('viewAttached', (wc) => this.watchTab(wc));
  }

  watchTab(wc) {
    const ipc = wc && wc.ipc;
    if (!ipc || typeof ipc.on !== 'function') return;
    ipc.on('vault:capture', (_e, payload) => this.onCapture(wc, payload));
    ipc.on('vault:field-focus', (_e, payload) => this.onFieldFocus(wc, payload));
    ipc.on('vault:field-blur', () => this.onFieldBlur(wc));
    ipc.on('vault:profile-focus', (_e, payload) => this.onProfileFocus(wc, payload));
    ipc.on('vault:profile-capture', (_e, payload) => this.onProfileCapture(wc, payload));
    ipc.on('vault:field-key', (_e, payload) => this.onFieldKey(wc, payload));
  }

  onProfileFocus(wc, payload) {
    const tab = this._tabFor(wc);
    if (!tab || this._store.status().unreadable) return null;
    const profiles = this._profiles();
    if (!profiles.length) return null;
    const message = {
      tabId: tab.id,
      rect: VaultService._rect(payload && payload.rect),
      zoom: VaultService._zoomOf(wc),
      matches: [],
      profiles: profiles.map((p) => ({ id: p.id, title: p.title, summary: AutofillFields.summary(p) })),
      canGenerate: false,
    };
    this._toChrome(tab.id, 'vault:field', message);
    return message;
  }

  onProfileCapture(wc, payload) {
    const tab = this._tabFor(wc);
    if (!tab || !this.offerAddresses() || this._store.status().unreadable) return null;
    if (!VaultSites.originOf(tab.url)) return null;
    const fields = AutofillFields.clean(payload && payload.fields);
    if (!AutofillFields.isWorthSaving(fields)) return null;
    const existing = this._profiles().find((p) => AutofillFields.sameProfile(p, fields));
    if (existing && AutofillFields.covers(existing, fields)) return null;
    return this._openPrompt(tab, {
      kind: 'profile', fields, updateId: existing ? existing.id : null,
    }, { kind: 'profile', summary: AutofillFields.summary(fields), update: !!existing });
  }

  fillProfile(tabId, itemId) {
    const tab = this._tabById(tabId);
    if (!tab) return { success: false, error: 'No such tab' };
    const item = this._store.get(String(itemId || ''));
    if (!item || item.type !== 'profile') return { success: false, error: 'Not found' };
    const profile = {};
    for (const key of AutofillFields.KEYS) if (item[key]) profile[key] = item[key];
    VaultService._send(tab.webContents, 'vault:do-fill-profile', { profile });
    try { this._store.recordUse(item.id); } catch (_) {}
    return { success: true };
  }

  _profiles() {
    return this._store.all().filter((i) => i.type === 'profile').sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
  }

  onCapture(wc, payload) {
    const tab = this._tabFor(wc);
    if (!tab || !this.offerToSave()) return null;
    const origin = VaultSites.originOf(tab.url);
    if (!origin || this.neverList().includes(origin)) return null;
    const username = VaultService._field(payload && payload.username).trim();
    const password = VaultService._field(payload && payload.password);
    const site = VaultSites.siteOf(origin);
    if (!password) {
      if (username) this._pendingUsers.set(tab.id, { site, username, at: this._now() });
      return null;
    }
    const user = username || this._rememberedUsername(tab.id, site);
    return this._offer(tab, origin, user, password);
  }

  onFieldFocus(wc, payload) {
    const tab = this._tabFor(wc);
    if (!tab) return null;
    const p = payload || {};
    if (p.kind === 'otp') return this._offerOtp(tab, wc, p);
    const canGenerate = !!p.newPassword && p.kind === 'password';
    const logins = canGenerate || this._store.status().unreadable ? [] : this._store.loginsFor(tab.url);
    if (!logins.length && !canGenerate) return null;
    const message = {
      tabId: tab.id,
      rect: VaultService._rect(p.rect),
      zoom: VaultService._zoomOf(wc),
      matches: logins.map((l) => ({ id: l.id, username: l.username, host: VaultSites.hostOf(l.origin), related: l.match === 'related' })),
      canGenerate,
    };
    this._toChrome(tab.id, 'vault:field', message);
    return message;
  }

  _offerOtp(tab, wc, p) {
    if (this._store.status().unreadable) return null;
    const logins = this._store.loginsFor(tab.url).filter((l) => Totp.parse(l.totp));
    if (!logins.length) return null;
    const message = {
      tabId: tab.id, rect: VaultService._rect(p.rect), zoom: VaultService._zoomOf(wc), otp: true, canGenerate: false,
      matches: logins.map((l) => ({ id: l.id, username: l.username, host: VaultSites.hostOf(l.origin), related: l.match === 'related' })),
    };
    this._toChrome(tab.id, 'vault:field', message);
    return message;
  }

  onFieldKey(wc, payload) {
    const tab = this._tabFor(wc);
    const key = payload && payload.key;
    if (!tab || !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(key)) return;
    this._toChrome(tab.id, 'vault:field-key', { tabId: tab.id, key });
  }

  menuState(tabId, state) {
    const tab = this._tabById(tabId);
    if (!tab) return { success: false };
    VaultService._send(tab.webContents, 'vault:menu-state', { open: !!(state && state.open), active: !!(state && state.active) });
    return { success: true };
  }

  onFieldBlur(wc) {
    const tab = this._tabFor(wc);
    if (tab) this._toChrome(tab.id, 'vault:field-gone', { tabId: tab.id });
  }

  fill(tabId, itemId) {
    const tab = this._tabById(tabId);
    if (!tab) return { success: false, error: 'No such tab' };
    const item = this._store.get(String(itemId || ''));
    if (!item || item.type !== 'login') return { success: false, error: 'Not found' };
    if (!VaultSites.match(item.origin, tab.url)) return { success: false, error: 'This login belongs to another site' };
    VaultService._send(tab.webContents, 'vault:do-fill', { username: item.username, password: item.password });
    try { this._store.recordUse(item.id); } catch (_) {}
    return { success: true };
  }

  fillGenerated(tabId) {
    const tab = this._tabById(tabId);
    if (!tab) return { success: false, error: 'No such tab' };
    VaultService._send(tab.webContents, 'vault:do-fill', { password: PasswordGenerator.generate(), generated: true });
    return { success: true };
  }

  loginsForTab(tabId) {
    const tab = this._tabById(tabId);
    if (!tab || this._store.status().unreadable) return [];
    return this._store.loginsFor(tab.url).map((l) => ({ id: l.id, username: l.username, host: VaultSites.hostOf(l.origin), related: l.match === 'related' }));
  }

  answerPrompt(promptId, decision) {
    const prompt = this._prompts.get(String(promptId || ''));
    if (!prompt) return { success: false };
    this._closePrompt(prompt);
    try {
      if (decision === 'save') this._savePrompted(prompt);
      else if (decision === 'never' && prompt.kind === 'login') this._db.set(VaultService.NEVER_KEY, [...new Set([...this.neverList(), prompt.origin])]);
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: true };
  }


  _offer(tab, origin, username, password) {
    const existing = this._store.findLogin(origin, username);
    if (existing && existing.password === password) {
      try { this._store.recordUse(existing.id); } catch (_) {}
      return null;
    }
    return this._openPrompt(tab, {
      kind: 'login', origin, username, password, updateId: existing ? existing.id : null,
    }, { kind: 'login', host: VaultSites.hostOf(origin), username, update: !!existing });
  }

  _openPrompt(tab, data, shown) {
    const dedupe = JSON.stringify([data.kind, data.username, data.password, data.fields]);
    const current = [...this._prompts.values()].find((p) => p.tabId === tab.id);
    if (current && current.dedupe === dedupe) return null;
    if (current) this._closePrompt(current);
    const prompt = { promptId: `vault-${crypto.randomUUID()}`, tabId: tab.id, dedupe, ...data };
    prompt.timer = setTimeout(() => this._closePrompt(prompt), VaultService.PROMPT_TIMEOUT_MS);
    if (prompt.timer.unref) prompt.timer.unref();
    this._prompts.set(prompt.promptId, prompt);
    const message = { promptId: prompt.promptId, tabId: tab.id, ...shown };
    this._toChrome(tab.id, 'vault:save-prompt', message);
    return message;
  }

  _savePrompted(prompt) {
    if (prompt.kind === 'profile') {
      if (prompt.updateId) this._store.update(prompt.updateId, prompt.fields);
      else this._store.add({ type: 'profile', title: prompt.fields.city || '', ...prompt.fields });
      return;
    }
    if (prompt.updateId) this._store.update(prompt.updateId, { password: prompt.password });
    else this._store.add({ type: 'login', origin: prompt.origin, username: prompt.username, password: prompt.password, title: VaultSites.hostOf(prompt.origin) });
  }

  _closePrompt(prompt) {
    if (!this._prompts.delete(prompt.promptId)) return;
    clearTimeout(prompt.timer);
    this._toChrome(prompt.tabId, 'vault:save-prompt-close', { promptId: prompt.promptId });
  }

  _rememberedUsername(tabId, site) {
    const pending = this._pendingUsers.get(tabId);
    if (!pending || pending.site !== site || this._now() - pending.at > VaultService.USERNAME_MEMORY_MS) return '';
    return pending.username;
  }

  _tabFor(wc) {
    const tvm = this._tvm();
    if (!tvm || !wc) return null;
    const id = tvm.findTabIdByWebContents(wc);
    return id === null || id === undefined ? null : this._tabById(id);
  }

  _tabById(tabId) {
    const tvm = this._tvm();
    const entry = tvm ? tvm.getEntry(Number(tabId)) : null;
    if (!entry || !entry.isRegularBrowsing()) return null;
    let url = entry.url;
    try { url = entry.webContents.getURL() || url; } catch (_) {}
    return { id: entry.id, url, webContents: entry.webContents };
  }

  _toChrome(tabId, channel, payload) {
    const tvm = this._tvm();
    const win = tvm ? tvm.windowOfTab(tabId) : null;
    if (win && !win.isDestroyed()) VaultService._send(win.webContents, channel, payload);
  }

  static _send(wc, channel, payload) {
    try { if (wc && !wc.isDestroyed()) wc.send(channel, payload); } catch (_) {}
  }

  static _field(value) {
    const s = value == null ? '' : String(value);
    return s.length > VaultService.MAX_FIELD ? '' : s;
  }

  static _rect(r) {
    const n = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
    return { x: n(r && r.x), y: n(r && r.y), width: n(r && r.width), height: n(r && r.height) };
  }

  static _zoomOf(wc) {
    try { return Number(wc.getZoomFactor()) || 1; } catch (_) { return 1; }
  }

  static _redact(item) {
    const { password, totp, value, ...rest } = item;
    const out = { ...rest, host: VaultSites.hostOf(item.origin), hasPassword: !!password };
    if (item.type === 'login') out.hasTotp = !!totp;
    if (item.type === 'key') { out.hasValue = !!value; out.placeholder = `{{vault:${VaultStore.slug(item.title)}}}`; }
    return out;
  }
}

module.exports = VaultService;
