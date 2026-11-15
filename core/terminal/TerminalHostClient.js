const path = require('path');
const SherpaWorkerProcess = require('../tts-server/runtimes/SherpaWorkerProcess');
const InheritedDebugEnv = require('./shells/InheritedDebugEnv');

class TerminalHostClient {
  static WORKER_PATH = path.join(__dirname, 'host', 'TerminalHostWorker.js');
  static SERVICE_NAME = 'LumaBrowser Terminal Host';
  static READY_TIMEOUT_MS = 20 * 1000;
  static HOST_GONE = 'The terminal host process stopped.';

  constructor({ onEvent = () => {}, env = process.env, log = console, createProcess = null } = {}) {
    this._onEvent = onEvent;
    this._env = env;
    this._log = log;
    this._createProcess = createProcess || ((options) => new SherpaWorkerProcess(options));
    this._process = null;
    this._starting = null;
    this._pending = new Map();
    this._nextId = 1;
  }

  async request(method, params = {}) {
    const worker = await this._ready();
    return new Promise((resolve, reject) => {
      const id = this._nextId++;
      this._pending.set(id, { resolve, reject });
      worker.post({ type: 'request', id, method, params });
    });
  }

  post(method, params = {}) {
    if (this._process && !this._starting) this._process.tryPost({ type: 'post', method, params });
  }

  async stop() {
    const worker = this._process;
    this._process = null;
    this._starting = null;
    if (worker) await worker.stop();
  }

  _ready() {
    if (this._process && !this._starting) return Promise.resolve(this._process);
    if (!this._starting) this._starting = this._start();
    return this._starting;
  }

  async _start() {
    const worker = this._createProcess({
      workerPath: TerminalHostClient.WORKER_PATH, serviceName: TerminalHostClient.SERVICE_NAME, label: 'Terminal host',
      readyTimeoutMs: TerminalHostClient.READY_TIMEOUT_MS,
      onMessage: (message) => this._onMessage(message),
      onExit: () => this._onHostExit(worker),
      onStderr: (text) => this._log.warn('[terminal-host]', text),
    });
    this._process = worker;
    try {
      await worker.start({ env: InheritedDebugEnv.forOwnProcess(this._env), initConfig: {}, timeoutMessage: 'The terminal host did not start in time.' });
      return worker;
    } finally {
      this._starting = null;
      if (worker.state !== 'ready' && this._process === worker) this._process = null;
    }
  }

  _onMessage(message) {
    if (message.type === 'event') return this._onEvent(message.event);
    if (message.type !== 'response') return;
    const waiter = this._pending.get(message.id);
    if (!waiter) return;
    this._pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error));
    else waiter.resolve(message.result);
  }

  _onHostExit(worker) {
    if (this._process === worker) this._process = null;
    for (const waiter of this._pending.values()) waiter.reject(new Error(TerminalHostClient.HOST_GONE));
    this._pending.clear();
    this._onEvent({ type: 'host-exit' });
  }
}

module.exports = TerminalHostClient;
