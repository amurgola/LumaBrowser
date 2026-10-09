const fs = require('fs');
const path = require('path');
const EventLoopDelaySampler = require('./EventLoopDelaySampler');
const MainCpuProfiler = require('./MainCpuProfiler');
const RendererCpuProfiler = require('./RendererCpuProfiler');
const RuntimeTraceScripts = require('./RuntimeTraceScripts');
const RuntimeTraceSummary = require('./RuntimeTraceSummary');

class RuntimeTraceCapture {
  static TRACE_CATEGORIES = [
    'toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline',
    'v8.execute', 'blink.user_timing', 'input', 'latencyInfo', 'ui', 'views',
  ];
  static COUNTDOWN_MS = 1000;
  static FINAL_TOAST_MS = 12000;

  constructor({ electron, webContents, dir, durationMs, mainProfiler, summarize = RuntimeTraceSummary.summarize }) {
    this._electron = electron;
    this._wc = webContents;
    this.dir = dir;
    this._durationMs = durationMs;
    this._mainProfiler = mainProfiler || new MainCpuProfiler();
    this._rendererProfiler = new RendererCpuProfiler(webContents);
    this._summarize = summarize;
    this._notes = [];
    this._timers = [];
  }

  async execute() {
    try {
      await this._begin();
    } catch (err) {
      this._stopTimers();
      if (this._sampler) this._sampler.stop();
      throw err;
    }
    await RuntimeTraceCapture._sleep(this._durationMs);
    return this._finish();
  }

  async _begin() {
    this._electron.app.getAppMetrics();
    await this._startChromiumTrace();
    this._startedAt = Date.now();
    this._startDelaySampler();
    await this._mainProfiler.start();
    await this._startRendererProfile();
    await this._installRendererCounters();
    await this._startCountdown();
    console.log(`[runtime-trace] recording ${this._durationMs}ms -> ${this.dir}`);
  }

  async _finish() {
    this._stopTimers();
    const delaySeries = this._sampler.stop();
    await this._toast('Trace captured. Writing profiles…', 0);
    const renderer = await this._collectRendererCounters();
    await this._writeRendererProfile();
    await this._writeMainProfile();
    await this._stopChromiumTrace();
    this._writeReport(delaySeries, renderer);
    const summary = this._summarizeCapture();
    return this._announce(summary);
  }

  async _startChromiumTrace() {
    try {
      await this._electron.contentTracing.startRecording({ included_categories: RuntimeTraceCapture.TRACE_CATEGORIES });
      this._tracing = true;
    } catch (err) {
      this._tracing = false;
      this._notes.push(`chromium trace unavailable: ${err.message}`);
    }
  }

  _startDelaySampler() {
    this._sampler = new EventLoopDelaySampler();
    this._sampler.start();
  }

  async _startRendererProfile() {
    this._rendererProfiling = false;
    try {
      await this._rendererProfiler.start();
      this._rendererProfiling = true;
    } catch (err) {
      this._notes.push(`renderer CPU profile unavailable: ${err.message}`);
    }
  }

  async _installRendererCounters() {
    try {
      await this._wc.executeJavaScript(RuntimeTraceScripts.RENDERER_INSTALL, true);
    } catch (err) {
      this._notes.push(`renderer counters unavailable: ${err.message}`);
    }
  }

  async _startCountdown() {
    const endsAt = this._startedAt + this._durationMs;
    this._timers.push(setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      this._toast(`Tracing UI thread: ${left}s left. Drag, resize and click around.`, 0);
    }, RuntimeTraceCapture.COUNTDOWN_MS));
    await this._toast(`Tracing UI thread: ${Math.round(this._durationMs / 1000)}s. Drag, resize and click around.`, 0);
  }

  _stopTimers() {
    for (const timer of this._timers) clearInterval(timer);
    this._timers = [];
  }

  async _collectRendererCounters() {
    try {
      return await this._wc.executeJavaScript(RuntimeTraceScripts.RENDERER_STOP, true);
    } catch (err) {
      this._notes.push(`renderer counters failed: ${err.message}`);
      return null;
    }
  }

  async _writeRendererProfile() {
    if (!this._rendererProfiling) return;
    await this._writeProfile(this._rendererProfiler, 'renderer.cpuprofile', 'renderer CPU profile failed');
  }

  async _writeMainProfile() {
    await this._writeProfile(this._mainProfiler, 'main.cpuprofile', 'main CPU profile failed');
  }

  async _writeProfile(profiler, fileName, failureNote) {
    try {
      const profile = await profiler.stop();
      fs.writeFileSync(path.join(this.dir, fileName), JSON.stringify(profile));
    } catch (err) {
      this._notes.push(`${failureNote}: ${err.message}`);
    }
    profiler.detach();
  }

  async _stopChromiumTrace() {
    if (!this._tracing) return;
    try {
      await this._electron.contentTracing.stopRecording(path.join(this.dir, 'chromium-trace.json'));
    } catch (err) {
      this._notes.push(`chromium trace failed to stop: ${err.message}`);
    }
  }

  _writeReport(delaySeries, renderer) {
    const { app, webContents } = this._electron;
    const report = {
      label: path.basename(this.dir),
      startedAt: new Date(this._startedAt).toISOString(),
      durationMs: this._durationMs,
      notes: this._notes,
      mainEventLoop: { series: delaySeries },
      renderer,
      shell: { webContentsId: this._wc.id, pid: this._wc.getOSProcessId() },
      contents: webContents.getAllWebContents().map((c) => ({ id: c.id, pid: c.getOSProcessId(), url: c.getURL() })),
      metrics: app.getAppMetrics(),
      versions: process.versions,
    };
    fs.writeFileSync(path.join(this.dir, 'report.json'), JSON.stringify(report, null, 2));
  }

  _summarizeCapture() {
    try {
      const summary = this._summarize(this.dir);
      console.log(`[runtime-trace] summary:\n${summary.markdown}`);
      return summary;
    } catch (err) {
      this._notes.push(`summary failed: ${err.message}`);
      console.error('[runtime-trace] summary failed', err);
      return null;
    }
  }

  async _announce(summary) {
    const headline = summary ? summary.headline : 'Summary failed; raw files were written.';
    await this._toast(`Trace saved: ${this.dir}\n${headline}`, RuntimeTraceCapture.FINAL_TOAST_MS);
    return { dir: this.dir, notes: this._notes, headline, summary: summary ? summary.json : null };
  }

  _toast(text, ttlMs) {
    return this._wc.executeJavaScript(RuntimeTraceScripts.toast(text, ttlMs), true).catch(() => {});
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = RuntimeTraceCapture;
