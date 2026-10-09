const GambitRunner = require('../gambit/GambitRunner');
const GambitCapabilities = require('../gambit/GambitCapabilities');
const GambitBridgeTurn = require('../gambit/GambitBridgeTurn');
const GambitTarget = require('./GambitTarget');
const GambitLive = require('./GambitLive');
const GambitProvenance = require('./GambitProvenance');

class GambitSession {
  static ALREADY_RUNNING = 'A compatibility gambit is already running.';
  static FIT_TEST_RUNNING = 'A fit test is running. Wait for it to finish.';
  static NO_MATCH = 'No tasks matched that filter.';
  static NO_RAW = 'No raw results in memory. Raw transcripts are kept only for the most recent run in this session.';

  constructor({
    llmServerService, chatRouter, fitTests, target = null, runner = GambitRunner,
    capabilities = GambitCapabilities, bridgeTurn = GambitBridgeTurn, now = () => new Date(), log = console,
  }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._fitTests = fitTests;
    this._target = target || new GambitTarget({ llmServerService, chatRouter });
    this._runner = runner;
    this._capabilities = capabilities;
    this._bridgeTurn = bridgeTurn;
    this._now = now;
    this._log = log;
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
    this._lastRaw = null;
  }

  async run(args, send) {
    const options = GambitSession.options(args);
    if (this._running) return { success: false, error: GambitSession.ALREADY_RUNNING };
    if (this._fitTests && this._fitTests.running) return { success: false, error: GambitSession.FIT_TEST_RUNNING };
    const target = await this._target.resolve(options.modelPath, send);
    if (target.error) return { success: false, error: target.error };
    const startedAt = this._now().toISOString();
    this._begin(target.livePath, startedAt);
    try {
      return await this._execute(options, target, startedAt, send);
    } catch (err) {
      send('error', { message: err.message });
      return { success: false, error: err.message };
    } finally {
      this._end();
    }
  }

  cancel() {
    if (!this._running) return { running: false };
    this._cancelRequested = true;
    return { running: true };
  }

  status() {
    if (this._running && this._live) return { running: true, live: this._live };
    return { running: false, live: null };
  }

  raw() {
    if (!this._lastRaw) return { success: false, error: GambitSession.NO_RAW };
    return { success: true, raw: this._lastRaw };
  }

  static options(args) {
    const {
      modelPath = null, filter = null, nativeHistory = false, nativeTools = null, agentEffort = null,
      parallel = null, promptExperiments = null,
    } = args || {};
    return { modelPath, filter, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments };
  }

  static filterSuite(suite, filter) {
    if (!filter || !(Array.isArray(filter.groups) || Array.isArray(filter.taskIds))) return suite;
    const groups = new Set(filter.groups || []);
    const ids = new Set(filter.taskIds || []);
    const tasks = (groups.size || ids.size) ? suite.filter((t) => groups.has(t.group) || ids.has(t.id)) : suite;
    return tasks.length ? tasks : null;
  }

  async _execute(options, target, startedAt, send) {
    const caps = await this._capabilities.detect();
    const fullSuite = this._runner.loadSuite();
    const suite = GambitSession.filterSuite(fullSuite, options.filter);
    if (!suite) return { success: false, error: GambitSession.NO_MATCH };
    const filtered = suite.length !== fullSuite.length;
    send('resolved', { modelPath: target.livePath, total: suite.length, capabilities: caps.caps, capabilityReasons: caps.reasons, filtered });
    this._live.total = suite.length;
    const report = await this._runSuite(suite, caps, options, target, startedAt, filtered, send);
    GambitProvenance.noteContextDrift(report, this._svc, target.defaults);
    this._lastRaw = { modelPath: target.livePath, ranAt: startedAt, report };
    const ranAt = this._persist(target.livePath, report, startedAt);
    const { raw, ...summary } = report;
    send(report.aborted ? 'canceled' : 'done', { report: summary, ranAt });
    return { success: true, canceled: !!report.aborted, report: summary, ranAt };
  }

  _runSuite(suite, caps, options, target, startedAt, filtered, send) {
    return this._runner.runGambit({
      tasks: suite,
      runTurn: this._bridgeTurn.create({
        bridge: this._router.agentBridge,
        deps: target.deps,
        modelRef: target.modelRef,
        nativeHistory: options.nativeHistory,
        nativeTools: options.nativeTools,
        agentEffort: options.agentEffort,
        parallel: options.parallel,
        promptExperiments: options.promptExperiments,
      }),
      capabilities: caps,
      isAborted: () => this._cancelRequested,
      meta: GambitProvenance.meta({ llmServerService: this._svc, defaults: target.defaults, livePath: target.livePath, modelRef: target.modelRef, modelLabel: target.modelLabel, startedAt, filtered, options }),
      onProgress: (p) => {
        if (this._live) this._live.apply(p);
        send('progress', p);
      },
    });
  }

  _persist(livePath, report, startedAt) {
    if (!GambitProvenance.isPersistable(report.meta)) return null;
    try {
      const saved = this._svc.saveGambitResults(livePath, { report, canceled: report.aborted, ranAt: startedAt });
      return saved && saved.ranAt;
    } catch (e) {
      this._log.warn('[llm-server] saveGambitResults failed:', e && e.message);
      return null;
    }
  }

  _begin(livePath, startedAt) {
    this._running = true;
    this._cancelRequested = false;
    this._lastRaw = null;
    this._live = new GambitLive(livePath, startedAt);
  }

  _end() {
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
  }
}

module.exports = GambitSession;
