const fs = require('fs');
const path = require('path');
const FreePort = require('../../core/shared/runtime/FreePort');
const ProfileOptions = require('./ProfileOptions');
const ProfileEnvironment = require('./ProfileEnvironment');
const ShellPageScripts = require('./ShellPageScripts');
const BoundsGeometryCheck = require('./BoundsGeometryCheck');

class PerformanceProfiler {
  static ENTRY_SCRIPT = path.join('scripts', 'performance-entry.js');
  static OUTPUT_DIR = path.join('test-data', 'performance');
  static SHELL_PAGE = /\/index\.html$/;
  static LAUNCH_TIMEOUT_MS = 60000;
  static SHELL_WAIT_MS = 30000;
  static PAGE_TIMEOUT_MS = 10000;
  static STARTUP_SETTLE_MS = 12000;
  static IDLE_MS = 6000;
  static SETTINGS_OPENS = 5;
  static TRACE_WAIT_MS = 30000;

  constructor(root, deps) {
    this._root = root;
    this._electron = deps.electron;
    this._electronPath = deps.electronPath;
    this._log = deps.log || ((s) => console.log(s));
    this._sleep = deps.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this._logs = [];
  }

  async execute(argv) {
    this._setupRun(argv);
    await this._launch();
    try {
      await this._openShell();
      const report = await this._measure();
      this._writeReport(report);
      const problem = report.geometry && report.geometry.problem;
      if (problem) throw new Error(problem);
      return report;
    } finally {
      fs.writeFileSync(path.join(this._output, 'console.log'), this._logs.join(''));
      await this._app.close();
    }
  }

  _setupRun(argv) {
    this._options = ProfileOptions.parse(argv);
    this._output = path.join(this._root, PerformanceProfiler.OUTPUT_DIR, this._options.label);
    fs.mkdirSync(this._output, { recursive: true });
  }

  async _launch() {
    const env = ProfileEnvironment.env(this._output, this._options, await FreePort.ephemeralPort());
    this._launched = Date.now();
    this._app = await this._electron.launch({
      executablePath: this._electronPath,
      cwd: this._root,
      env,
      args: ProfileEnvironment.args(path.join(this._root, PerformanceProfiler.ENTRY_SCRIPT), this._output),
      timeout: PerformanceProfiler.LAUNCH_TIMEOUT_MS,
    });
    this._app.process().stdout.on('data', (data) => this._logs.push(data.toString()));
    this._app.process().stderr.on('data', (data) => this._logs.push(data.toString()));
  }

  async _openShell() {
    this._page = await this._waitForShellPage();
    this._page.setDefaultTimeout(PerformanceProfiler.PAGE_TIMEOUT_MS);
    this._page.on('console', (msg) => this._logs.push(`[renderer] ${msg.text()}\n`));
    await this._page.waitForLoadState('domcontentloaded');
    this._shellReadyMs = Date.now() - this._launched;
    await this._page.evaluate(ShellPageScripts.installLongTaskObserver);
  }

  async _waitForShellPage() {
    const deadline = Date.now() + PerformanceProfiler.SHELL_WAIT_MS;
    while (Date.now() < deadline) {
      const page = this._app.windows().find((p) => PerformanceProfiler.SHELL_PAGE.test(p.url()));
      if (page) return page;
      await this._sleep(50);
    }
    throw new Error('Shell index.html did not open');
  }

  async _measure() {
    const { startup, idle } = await this._measureStartupAndIdle();
    await this._startRuntimeTrace();
    const boundsHooked = await this._page.evaluate(ShellPageScripts.installBoundsHook, ShellPageScripts.BOUNDS_MODULE);
    const rendering = await this._page.evaluate(ShellPageScripts.measureBackgroundUpdates);
    const interactions = await this._measureSettingsOpens();
    const geometry = await this._measureGeometry();
    const tabSwitches = this._options.firstRun ? [] : await this._page.evaluate(ShellPageScripts.measureTabSwitches);
    const renderer = await this._page.evaluate(ShellPageScripts.readRendererTimings);
    await this._finishCaptures();
    return { shellReadyMs: this._shellReadyMs, startup, idle, interactions, renderer, rendering, geometry, tabSwitches, boundsHooked };
  }

  async _measureStartupAndIdle() {
    await this._sleep(PerformanceProfiler.STARTUP_SETTLE_MS);
    const startup = await this._app.evaluate(() => global.__lumaPerf.snapshot());
    await this._app.evaluate(() => global.__lumaPerf.stopCpuProfile());
    await this._app.evaluate(() => global.__lumaPerf.resetDelay());
    await this._sleep(PerformanceProfiler.IDLE_MS);
    const idle = await this._app.evaluate(() => global.__lumaPerf.snapshot());
    return { startup, idle };
  }

  _startRuntimeTrace() {
    return this._app.evaluate(({ contentTracing }, categories) => contentTracing.startRecording({
      included_categories: categories,
    }), ProfileEnvironment.TRACE_CATEGORIES);
  }

  async _measureSettingsOpens() {
    const samples = [];
    const count = this._options.firstRun ? 0 : PerformanceProfiler.SETTINGS_OPENS;
    for (let i = 0; i < count; i++) {
      const start = Date.now();
      await this._page.evaluate(() => openSettings());
      await this._page.locator('#settingsModal').waitFor({ state: 'visible' });
      samples.push(Date.now() - start);
      await this._page.locator('#settingsCloseBtn').click();
    }
    return samples;
  }

  async _measureGeometry() {
    if (this._options.firstRun) return null;
    const geometry = await this._page.evaluate(ShellPageScripts.measureGeometry);
    if (geometry.skipped) return geometry;
    const problem = BoundsGeometryCheck.problem(geometry);
    return problem ? { ...geometry, problem } : geometry;
  }

  async _finishCaptures() {
    await this._app.evaluate(({ contentTracing }, file) => contentTracing.stopRecording(file),
      path.join(this._output, 'runtime-trace.json'));
    await this._page.screenshot({ path: path.join(this._output, 'shell.png') });
    const tracePath = path.join(this._output, ProfileEnvironment.STARTUP_TRACE_FILE);
    const deadline = Date.now() + PerformanceProfiler.TRACE_WAIT_MS;
    while (!fs.existsSync(tracePath) && Date.now() < deadline) await this._sleep(100);
  }

  _writeReport(report) {
    fs.writeFileSync(path.join(this._output, 'report.json'), JSON.stringify(report, null, 2));
    this._log(JSON.stringify({
      output: this._output, shellReadyMs: report.shellReadyMs, milestones: report.startup.milestones,
      eventLoop: report.startup.eventLoop, idle: report.idle.eventLoop, interactions: report.interactions,
      paints: report.renderer.paints, rendering: report.rendering, geometry: report.geometry,
    }, null, 2));
  }
}

module.exports = PerformanceProfiler;
