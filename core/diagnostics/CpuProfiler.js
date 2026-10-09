class CpuProfiler {
  static SAMPLING_INTERVAL_US = 500;

  async start() {
    await this._attach();
    await this._send('Profiler.enable');
    await this._send('Profiler.setSamplingInterval', { interval: CpuProfiler.SAMPLING_INTERVAL_US });
    await this._send('Profiler.start');
  }

  async stop() {
    const { profile } = await this._send('Profiler.stop');
    return profile;
  }

  detach() {
    try { this._detach(); } catch (_) {}
  }

  async _attach() {
    throw new Error(`${this.constructor.name} must implement _attach()`);
  }

  async _send(_method, _params) {
    throw new Error(`${this.constructor.name} must implement _send()`);
  }

  _detach() {
    throw new Error(`${this.constructor.name} must implement _detach()`);
  }
}

module.exports = CpuProfiler;
