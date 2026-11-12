const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

class LaunchBenchSampler {
  static INTERVAL_MS = 1000;

  static DMON_ARGS = ['dmon', '-s', 'pumt', '-d', '1'];

  static GPU_FIELDS = [['sm', 'sm_pct'], ['mem', 'mem_pct'], ['fb', 'fb_mb'], ['pwr', 'power_w'], ['rxpci', 'rx_mbs'], ['txpci', 'tx_mbs']];

  static HOST_FIELDS = ['t', 'elapsed_s', 'phase', 'cpu_pct', 'ram_used_mb', 'ram_free_mb'];

  static FLUSH_EVERY = 30;

  constructor({ file, spawnFn = spawn, now = Date.now, cpuTimes = LaunchBenchSampler.cpuTimes, memory = LaunchBenchSampler.memory, intervalMs = LaunchBenchSampler.INTERVAL_MS }) {
    this._file = file;
    this._spawn = spawnFn;
    this._now = now;
    this._cpuTimes = cpuTimes;
    this._memory = memory;
    this._intervalMs = intervalMs;
    this._rows = [];
    this._latest = new Map();
    this._columns = null;
    this._phase = null;
    this._child = null;
    this._timer = null;
    this._t0 = 0;
    this._lastCpu = null;
  }

  start(phase) {
    this._phase = phase;
    this._t0 = this._now();
    this._lastCpu = this._cpuTimes();
    this._startDmon();
    this._timer = setInterval(() => this.sample(), this._intervalMs);
    if (typeof this._timer.unref === 'function') this._timer.unref();
  }

  mark(phase) {
    this._phase = phase;
  }

  async stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this.sample();
    if (this._child) {
      try { this._child.kill(); } catch (_) {}
      this._child = null;
    }
    this._flush();
    return this.summary();
  }

  sample() {
    const now = this._now();
    const cpu = this._cpuTimes();
    const mem = this._memory();
    const row = {
      t: new Date(now).toISOString(),
      elapsed_s: +((now - this._t0) / 1000).toFixed(1),
      phase: this._phase,
      cpu_pct: LaunchBenchSampler.cpuBusyPct(this._lastCpu, cpu),
      ram_used_mb: Math.round((mem.total - mem.free) / 2 ** 20),
      ram_free_mb: Math.round(mem.free / 2 ** 20),
      gpus: [...this._latest.entries()].sort((a, b) => a[0] - b[0]).map(([index, values]) => ({ index, ...values })),
    };
    this._lastCpu = cpu;
    this._rows.push(row);
    if (this._rows.length % LaunchBenchSampler.FLUSH_EVERY === 0) this._flush();
    return row;
  }

  get rows() {
    return this._rows;
  }

  summary() {
    const phases = {};
    for (const row of this._rows) {
      if (!phases[row.phase]) phases[row.phase] = [];
      phases[row.phase].push(row);
    }
    const out = { file: this._file, gpus: this._gpuCount(), phases: {} };
    for (const [phase, rows] of Object.entries(phases)) out.phases[phase] = LaunchBenchSampler.reduce(rows, out.gpus);
    return out;
  }

  static reduce(rows, gpus) {
    const stat = (values) => {
      const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
      if (!nums.length) return { mean: null, peak: null };
      return { mean: +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1), peak: +Math.max(...nums).toFixed(1) };
    };
    const gpu = (i) => rows.map((r) => r.gpus.find((g) => g.index === i) || {});
    return {
      seconds: rows.length ? +(rows[rows.length - 1].elapsed_s - rows[0].elapsed_s + 1).toFixed(0) : 0,
      cpuPct: stat(rows.map((r) => r.cpu_pct)),
      ramUsedMb: stat(rows.map((r) => r.ram_used_mb)),
      gpus: Array.from({ length: gpus }, (_, i) => ({
        index: i,
        smPct: stat(gpu(i).map((g) => g.sm_pct)),
        fbMb: stat(gpu(i).map((g) => g.fb_mb)),
        powerW: stat(gpu(i).map((g) => g.power_w)),
        pcieMbs: stat(gpu(i).map((g) => (g.rx_mbs == null && g.tx_mbs == null ? null : (g.rx_mbs || 0) + (g.tx_mbs || 0)))),
      })),
    };
  }

  static parseDmonHeader(line) {
    const cols = line.replace(/^#\s*/, '').trim().split(/\s+/);
    return cols.length && cols[0] === 'gpu' ? cols : null;
  }

  static parseDmonRow(line, columns) {
    if (!columns || /^#/.test(line)) return null;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2 || !/^\d+$/.test(parts[0])) return null;
    const values = {};
    for (const [col, key] of LaunchBenchSampler.GPU_FIELDS) {
      const at = columns.indexOf(col);
      const raw = at >= 0 ? parts[at] : undefined;
      values[key] = raw === undefined || raw === '-' ? null : Number(raw);
    }
    return { index: Number(parts[0]), values };
  }

  static cpuBusyPct(before, after) {
    if (!before || !after) return null;
    const sum = (t) => Object.values(t).reduce((a, b) => a + b, 0);
    const total = sum(after) - sum(before);
    const idle = after.idle - before.idle;
    if (total <= 0) return null;
    return +((1 - idle / total) * 100).toFixed(1);
  }

  static cpuTimes() {
    const sum = { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
    for (const cpu of os.cpus()) for (const k of Object.keys(sum)) sum[k] += cpu.times[k] || 0;
    return sum;
  }

  static memory() {
    return { total: os.totalmem(), free: os.freemem() };
  }

  static csv(rows, gpus) {
    const header = [...LaunchBenchSampler.HOST_FIELDS];
    for (let i = 0; i < gpus; i++) for (const [, key] of LaunchBenchSampler.GPU_FIELDS) header.push(`gpu${i}_${key}`);
    const lines = [header.join(',')];
    for (const row of rows) {
      const cells = LaunchBenchSampler.HOST_FIELDS.map((k) => (row[k] == null ? '' : row[k]));
      for (let i = 0; i < gpus; i++) {
        const g = row.gpus.find((x) => x.index === i) || {};
        for (const [, key] of LaunchBenchSampler.GPU_FIELDS) cells.push(g[key] == null ? '' : g[key]);
      }
      lines.push(cells.join(','));
    }
    return lines.join('\n') + '\n';
  }

  _gpuCount() {
    let max = 0;
    for (const row of this._rows) for (const g of row.gpus) max = Math.max(max, g.index + 1);
    return max;
  }

  _flush() {
    if (!this._file) return;
    try {
      fs.writeFileSync(this._file, LaunchBenchSampler.csv(this._rows, this._gpuCount()));
    } catch (_) {}
  }

  _startDmon() {
    let child;
    try {
      child = this._spawn('nvidia-smi', LaunchBenchSampler.DMON_ARGS, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (_) {
      return;
    }
    if (!child || !child.stdout) return;
    this._child = child;
    let pending = '';
    child.stdout.on('data', (chunk) => {
      pending += String(chunk);
      const lines = pending.split(/\r?\n/);
      pending = lines.pop();
      for (const line of lines) this._onDmonLine(line);
    });
    child.on('error', () => { this._child = null; });
    child.on('exit', () => { this._child = null; });
  }

  _onDmonLine(line) {
    if (/^#/.test(line)) {
      const columns = LaunchBenchSampler.parseDmonHeader(line);
      if (columns) this._columns = columns;
      return;
    }
    const row = LaunchBenchSampler.parseDmonRow(line, this._columns);
    if (row) this._latest.set(row.index, row.values);
  }
}

module.exports = LaunchBenchSampler;
