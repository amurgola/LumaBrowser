const axios = require('axios');
const Wsl = require('../runtimes/Wsl');

class WslHostFailover {
  static LOOPBACK = '127.0.0.1';
  static FALLBACK_AFTER_MISSES = 20;
  static IP_LOOKUP_TIMEOUT_MS = 5000;
  static IPV4 = /^\d+\.\d+\.\d+\.\d+$/;

  constructor({ plan = {}, logTag = '[wsl]', onHostChange = () => {} } = {}) {
    this.mode = plan.mode === 'wsl' ? 'wsl' : 'native';
    this.distro = this.isWsl ? (plan.distro || null) : null;
    this.host = plan.host || WslHostFailover.LOOPBACK;
    this._pattern = plan.processPattern || null;
    this._logTag = logTag;
    this._onHostChange = onHostChange;
    this._misses = 0;
    this._altHost = null;
  }

  get isWsl() {
    return this.mode === 'wsl';
  }

  async probe(port, { path = '/health', timeoutMs = 1500 } = {}) {
    for (const host of this._candidates()) {
      if (await WslHostFailover._answers(host, port, path, timeoutMs)) {
        this._onAnswered(host);
        return true;
      }
    }
    await this._onMiss();
    return false;
  }

  async killPort(port) {
    if (!this.isWsl || !port) return;
    try {
      await Wsl.killPortInWsl(this.distro, port, { pattern: this._pattern });
    } catch (err) {
      console.warn(`${this._logTag} WSL kill-by-port failed:`, err && err.message);
    }
  }

  killPortDetached(port) {
    if (!this.isWsl || !port) return;
    Promise.resolve()
      .then(() => Wsl.killPortInWsl(this.distro, port, { pattern: this._pattern }))
      .catch(() => {});
  }

  _candidates() {
    const hosts = [this.host];
    if (this._altHost && !hosts.includes(this._altHost)) hosts.push(this._altHost);
    return hosts;
  }

  static async _answers(host, port, path, timeoutMs) {
    try {
      const res = await axios.get(`http://${host}:${port}${path}`, { timeout: timeoutMs, validateStatus: () => true });
      return res.status === 200;
    } catch (_) {
      return false;
    }
  }

  _onAnswered(host) {
    this._misses = 0;
    if (host === this.host) return;
    this.host = host;
    console.log(`${this._logTag} health answered on ${host}: routing requests there`);
    this._onHostChange(host);
  }

  async _onMiss() {
    this._misses += 1;
    if (!this.isWsl || this._altHost || this._misses < WslHostFailover.FALLBACK_AFTER_MISSES) return;
    const ip = await this._distroIp();
    if (!ip) return;
    this._altHost = ip;
    console.log(`${this._logTag} localhost not answering: will also probe WSL IP ${ip}`);
  }

  async _distroIp() {
    try {
      const r = await Wsl.runInWsl(this.distro, 'hostname -I', { timeout: WslHostFailover.IP_LOOKUP_TIMEOUT_MS });
      if (!r || !r.ok) return null;
      return String(r.stdout || '').trim().split(/\s+/).find((s) => WslHostFailover.IPV4.test(s)) || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = WslHostFailover;
