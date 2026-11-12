const fs = require('fs');
const path = require('path');
const CrashTracer = require('../../core/diagnostics/CrashTracer');
const CrashReproOptions = require('./CrashReproOptions');
const CrashReproLaunch = require('./CrashReproLaunch');
const CrashReproReport = require('./CrashReproReport');
const UserDataLocator = require('./UserDataLocator');
const RunningInstanceCheck = require('./RunningInstanceCheck');
const RunArtifacts = require('./RunArtifacts');
const TabChurnDriver = require('./TabChurnDriver');
const InteractionDriver = require('./InteractionDriver');

class CrashRepro {
  static INTERACT_SCRIPT = path.join('scripts', 'crash-repro-interact.ps1');

  constructor({ root, electronPath, env = process.env, platform = process.platform, log = console.log,
    error = console.error, write = (s) => process.stdout.write(s), instanceCheck = RunningInstanceCheck,
    makeLaunch = (deps) => new CrashReproLaunch(deps), sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    this._root = root;
    this._electron = electronPath;
    this._env = env;
    this._platform = platform;
    this._log = log;
    this._error = error;
    this._write = write;
    this._instanceCheck = instanceCheck;
    this._makeLaunch = makeLaunch;
    this._sleep = sleep;
  }

  async execute(argv) {
    this._o = CrashReproOptions.parse(argv, { root: this._root, env: this._env });
    if (this._o.help) return this._printUsage();
    this._resolvePaths();
    if (this._o.dryRun) return this._printPlan();
    if (this._refuseWhenBusy()) return 2;
    fs.mkdirSync(this._o.outDir, { recursive: true });
    this._printHeader();
    const results = await this._runAll();
    return this._finish(results);
  }

  _printUsage() {
    this._log(CrashReproOptions.USAGE);
    return 0;
  }

  _resolvePaths() {
    const appName = require(path.join(this._root, 'package.json')).name;
    this._userData = UserDataLocator.resolve({ env: this._env, platform: this._platform, appName });
    this._traceDir = path.join(this._userData, CrashTracer.DIR_NAME);
    this._reportsDir = path.join(this._userData, 'Crashpad', 'reports');
  }

  _printPlan() {
    this._printHeader();
    const { file, args } = CrashReproLaunch.command(this._electron, path.join(this._o.outDir, 'run-01'));
    this._log(`dry run: would launch ${this._o.runs} time(s) from ${this._root}:`);
    this._log(`  ${CrashTracer.AUTO_QUIT_ENV}=${this._o.holdMs} ${file} ${args.join(' ')}`);
    this._log(`  instance guard: ${this._guardApplies() ? 'on (real profile)' : 'off (isolated LUMA_DATA_DIR)'}`);
    if (this._o.drive) this._log(`  tab churn against http://127.0.0.1:${this._o.apiPort}/api/browser`);
    return 0;
  }

  _guardApplies() {
    return !UserDataLocator.isIsolated(this._env);
  }

  _refuseWhenBusy() {
    if (!this._guardApplies()) return false;
    const busy = this._instanceCheck.list({ platform: this._platform });
    if (!busy.length) return false;
    this._error(`Refusing to start: another instance is running (${busy.join('; ')}). Close it first.`);
    return true;
  }

  _printHeader() {
    for (const line of CrashReproReport.header(this._o, { userData: this._userData, traceDir: this._traceDir })) this._log(line);
  }

  async _runAll() {
    const results = [];
    for (let i = 1; i <= this._o.runs; i++) {
      this._write(`run ${i}/${this._o.runs} ... `);
      const r = await this._launch().execute(i);
      results.push(r);
      this._write(`${CrashReproReport.runLine(r)}\n`);
      if (r.verdict !== 'clean') {
        for (const line of CrashReproReport.reproductionLines(r)) this._log(line);
        if (this._o.stopOnCrash) break;
      }
      await this._sleep(this._o.pauseMs);
    }
    return results;
  }

  _launch() {
    return this._makeLaunch({
      electronPath: this._electron, root: this._root, options: this._o, env: this._env, platform: this._platform,
      artifacts: new RunArtifacts({ traceDir: this._traceDir, reportsDir: this._reportsDir }),
      tabDriver: this._o.drive ? new TabChurnDriver({ port: this._o.apiPort }) : null,
      interaction: this._o.interact
        ? new InteractionDriver({ scriptPath: path.join(this._root, CrashRepro.INTERACT_SCRIPT), platform: this._platform })
        : null,
    });
  }

  _finish(results) {
    for (const line of CrashReproReport.summaryLines(results)) this._log(line);
    const summary = { runs: this._o.runs, holdMs: this._o.holdMs, results };
    fs.writeFileSync(path.join(this._o.outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    return results.some((r) => r.verdict !== 'clean') ? 1 : 0;
  }
}

module.exports = CrashRepro;
