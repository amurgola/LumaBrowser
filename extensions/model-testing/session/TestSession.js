const TestTarget = require('./TestTarget');
const TestRunLive = require('./TestRunLive');

class TestSession {
  static ALREADY_RUNNING = 'A model test is already running.';
  static FIT_TEST_RUNNING = 'A fit test is running. Wait for it to finish.';
  static NO_SUITES = 'Pick at least one test to run.';
  static NO_RAW = 'No raw results in memory. Raw transcripts are kept only for the most recent run in this session.';

  constructor({ llmServerService, chatRouter, catalog, target = null, now = () => new Date(), log = console }) {
    this._svc = llmServerService;
    this._catalog = catalog;
    this._target = target || new TestTarget({ llmServerService, chatRouter });
    this._now = now;
    this._log = log;
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
    this._lastRaw = null;
  }

  async run(args) {
    const { modelPath = null, suiteIds = [], options = {} } = args || {};
    const refusal = this._refusal();
    if (refusal) return { success: false, error: refusal };
    const suites = this._catalog.pick(suiteIds);
    if (!suites.length) return { success: false, error: TestSession.NO_SUITES };
    const startedAt = this._now().toISOString();
    this._begin(modelPath, suites, startedAt);
    try {
      return await this._execute(modelPath, suites, options || {}, startedAt);
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      await this._restoreDefaultModel();
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

  raw(suiteId) {
    const report = this._lastRaw && this._lastRaw.reports[suiteId];
    if (!report) return { success: false, error: TestSession.NO_RAW };
    return { success: true, raw: { modelPath: this._lastRaw.modelPath, ranAt: this._lastRaw.ranAt, suiteId, report } };
  }

  rawIndex() {
    if (!this._lastRaw) return null;
    return { modelPath: this._lastRaw.modelPath, suiteIds: Object.keys(this._lastRaw.reports) };
  }

  _refusal() {
    if (this._running) return TestSession.ALREADY_RUNNING;
    return this._svc.fitTestRunning ? TestSession.FIT_TEST_RUNNING : null;
  }

  async _execute(modelPath, suites, options, startedAt) {
    const target = await this._target.resolve(modelPath, (state) => this._live.noteServer(state));
    if (target.error) return { success: false, error: target.error };
    this._live.modelPath = target.livePath;
    this._lastRaw = { modelPath: target.livePath, ranAt: startedAt, reports: {} };
    const runs = [];
    for (const suite of suites) {
      if (this._cancelRequested) break;
      runs.push(await this._runSuite(suite, target, options, startedAt));
    }
    return { success: true, canceled: this._cancelRequested, modelPath: target.livePath, runs, outcomes: this._live.outcomes };
  }

  async _runSuite(suite, target, options, startedAt) {
    this._live.beginSuite(suite.id);
    const report = await suite.run({
      target,
      options,
      startedAt,
      isAborted: () => this._cancelRequested,
      onProgress: (progress) => this._live.apply(progress),
    });
    this._lastRaw.reports[suite.id] = report;
    const { raw, ...summary } = report;
    return { suiteId: suite.id, report: summary, canceled: !!report.aborted, ranAt: this._save(suite, target.livePath, report, startedAt) };
  }

  _save(suite, modelPath, report, startedAt) {
    try {
      return suite.save(modelPath, report, startedAt);
    } catch (err) {
      this._log.warn(`[model-testing] saving the ${suite.id} result failed:`, err && err.message);
      return null;
    }
  }

  async _restoreDefaultModel() {
    try {
      await this._target.restore();
    } catch (err) {
      this._log.warn('[model-testing] restoring the default model failed:', err && err.message);
    }
  }

  _begin(modelPath, suites, startedAt) {
    this._running = true;
    this._cancelRequested = false;
    this._lastRaw = null;
    this._live = new TestRunLive({ modelPath, suiteIds: suites.map((suite) => suite.id), startedAt });
  }

  _end() {
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
  }
}

module.exports = TestSession;
