const fs = require('fs');
const http = require('http');
const { spawn, execFile } = require('child_process');

class LaunchBenchServer {
  static HEALTH_POLL_MS = 1500;
  static READY_LIMIT_MS = 30 * 60 * 1000;
  static REQUEST_TIMEOUT_MS = 30 * 60 * 1000;
  static STOP_WAIT_MS = 20000;
  static SETTLE_MS = 4000;

  constructor({ binaryPath, args, env, port, logPath }) {
    this._binaryPath = binaryPath;
    this._args = args;
    this._env = env;
    this._port = port;
    this._logPath = logPath;
    this._proc = null;
    this._log = null;
  }

  get alive() {
    return !!this._proc && this._proc.exitCode == null && !this._exited;
  }

  async start() {
    this._log = fs.openSync(this._logPath, 'w');
    this._exited = false;
    this._proc = spawn(this._binaryPath, this._args, { env: this._env, stdio: ['ignore', this._log, this._log] });
    this._proc.on('exit', () => { this._exited = true; });
    const t0 = Date.now();
    while (Date.now() - t0 < LaunchBenchServer.READY_LIMIT_MS) {
      if (!this.alive) return null;
      try {
        const h = await this.request('/health', null, 5000);
        if (h && h.status === 'ok') return (Date.now() - t0) / 1000;
      } catch (e) {}
      await LaunchBenchServer.sleep(LaunchBenchServer.HEALTH_POLL_MS);
    }
    return null;
  }

  async complete(prompt, nPredict, { chat = false } = {}) {
    const sampling = { temperature: 0, top_k: 1, seed: 1, cache_prompt: false };
    if (!chat) return this.request('/completion', { prompt, n_predict: nPredict, ...sampling });
    const r = await this.request('/v1/chat/completions', { messages: [{ role: 'user', content: prompt }], max_tokens: nPredict, ...sampling });
    const message = (r.choices && r.choices[0] && r.choices[0].message) || {};
    return { content: (message.reasoning_content || '') + (message.content || ''), timings: r.timings || {} };
  }

  request(route, body, timeoutMs = LaunchBenchServer.REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const data = body == null ? null : Buffer.from(JSON.stringify(body));
      const req = http.request({
        host: '127.0.0.1', port: this._port, path: route, method: data ? 'POST' : 'GET', timeout: timeoutMs,
        headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {},
      }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error(`${route} timed out`)));
      if (data) req.write(data);
      req.end();
    });
  }

  async stop() {
    if (this._proc && this.alive) {
      try { this._proc.kill(); } catch (e) {}
      const t0 = Date.now();
      while (this.alive && Date.now() - t0 < LaunchBenchServer.STOP_WAIT_MS) await LaunchBenchServer.sleep(500);
    }
    if (this._log != null) { fs.closeSync(this._log); this._log = null; }
    await LaunchBenchServer.sleep(LaunchBenchServer.SETTLE_MS);
  }

  cacheStatsLines() {
    try {
      return fs.readFileSync(this._logPath, 'utf8').split(/\r?\n/).filter((l) => /llama_moe_cache|MoE cache/.test(l)).slice(-6);
    } catch (e) {
      return [];
    }
  }

  static gpuMemoryMib() {
    return new Promise((resolve) => {
      execFile('nvidia-smi', ['--query-gpu=index,memory.used', '--format=csv,noheader,nounits'], (err, out) => {
        const res = {};
        if (!err) {
          for (const line of String(out).trim().split(/\r?\n/)) {
            const [i, used] = line.split(',').map((s) => s.trim());
            if (i !== '') res['gpu' + i] = Number(used);
          }
        }
        resolve(res);
      });
    });
  }

  static sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = LaunchBenchServer;
