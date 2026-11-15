const path = require('path');
const ThinkingText = require('../shared/text/ThinkingText');

class PromptApiService {
  static ENABLED_KEY = 'core.promptApi.enabled';
  static WORKER = path.join(__dirname, 'worker', 'prompt-api-worker.js');
  static SERVICE_NAME = 'LumaBrowser Prompt API';
  static TIMEOUT_MS = 120000;
  static REFUSED = 'This site is not allowed to use the local model';

  constructor({ db, getRouter, access, fork = null, log = console }) {
    this._db = db;
    this._getRouter = getRouter;
    this._access = access;
    this._fork = fork;
    this._log = log;
    this._sessions = new Set();
    this._worker = null;
  }

  enabled() {
    return this._db.get(PromptApiService.ENABLED_KEY, false) === true;
  }

  status() {
    return { enabled: this.enabled(), running: !!this._worker };
  }

  setEnabled(enabled) {
    this._db.set(PromptApiService.ENABLED_KEY, !!enabled);
    this.apply();
    return this.status();
  }

  attachSession(sess) {
    if (!sess || typeof sess.registerLocalAIHandler !== 'function' || this._sessions.has(sess)) return;
    this._sessions.add(sess);
    if (this.enabled()) this._register(sess, this._startWorker());
  }

  apply() {
    if (this.enabled()) {
      const worker = this._startWorker();
      for (const sess of this._sessions) this._register(sess, worker);
      return;
    }
    this._release();
  }

  dispose() {
    this._release();
    this._sessions.clear();
  }

  _startWorker() {
    if (this._worker) return this._worker;
    const fork = this._fork || require('electron').utilityProcess.fork;
    const worker = fork(PromptApiService.WORKER, [], { serviceName: PromptApiService.SERVICE_NAME });
    worker.on('message', (message) => this._onMessage(worker, message));
    worker.on('exit', () => this._onExit(worker));
    this._worker = worker;
    return worker;
  }

  _register(sess, worker) {
    try { sess.registerLocalAIHandler(worker); } catch (err) { this._log.warn(`[prompt-api] handler not registered: ${err.message}`); }
  }

  _release() {
    for (const sess of this._sessions) this._register(sess, null);
    const worker = this._worker;
    this._worker = null;
    if (worker) { try { worker.kill(); } catch (_) {} }
  }

  _onExit(worker) {
    if (this._worker !== worker) return;
    this._log.warn('[prompt-api] the worker exited; web pages lose the local model until the setting is switched again');
    this._release();
  }

  async _onMessage(worker, message) {
    if (!message || message.type !== 'request') return;
    let reply;
    try {
      reply = { result: await this._answer(message.method, message.params || {}) };
    } catch (err) {
      reply = { error: (err && err.message) || String(err) };
    }
    try { worker.postMessage({ type: 'reply', id: message.id, ...reply }); } catch (_) {}
  }

  _answer(method, params) {
    if (method === 'availability') return this._availability(params);
    if (method === 'access') return this._requireAccess(params);
    if (method === 'prompt') return this._prompt(params);
    throw new Error(`Unknown Prompt API request "${method}"`);
  }

  _availability({ origin }) {
    return this._router() && !this._access.blocked(origin) ? 'available' : 'unavailable';
  }

  async _requireAccess({ webContentsId, origin }) {
    if (!(await this._access.allowed({ webContentsId, origin }))) throw new Error(PromptApiService.REFUSED);
    return true;
  }

  async _prompt({ webContentsId, origin, messages }) {
    await this._requireAccess({ webContentsId, origin });
    const router = this._router();
    if (!router) throw new Error('No local model is available');
    this._log.log(`[prompt-api] ${origin || 'unknown origin'}: prompt with ${messages.length} message(s)`);
    const result = await router.complete({ messages, timeoutMs: PromptApiService.TIMEOUT_MS, noThink: true });
    if (!result || typeof result.text !== 'string') throw new Error((result && result.error) || 'The model gave no answer');
    return ThinkingText.strip(result.text);
  }

  _router() {
    const router = this._getRouter();
    return router && typeof router.complete === 'function' ? router : null;
  }
}

module.exports = PromptApiService;
