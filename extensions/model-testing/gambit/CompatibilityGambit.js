const GambitRunner = require('./GambitRunner');
const GambitCapabilities = require('./GambitCapabilities');
const GambitBridgeTurn = require('./GambitBridgeTurn');
const GambitProvenance = require('./GambitProvenance');
const GambitResultStore = require('./GambitResultStore');

class CompatibilityGambit {
  static ID = 'compatibility-gambit';
  static LABEL = 'LumaBrowser compatibility gambit';
  static DESCRIPTION = 'Grades the model on the job LumaBrowser gives it: following instructions, holding a conversation, driving the browser, picking the right tool, answering correctly, building a working artifact, and finishing a turn without looping.';
  static DURATION = '30 to 60 minutes';
  static NO_MATCH = 'No tasks matched that filter.';

  constructor({
    llmServerService, chatRouter, runner = GambitRunner, capabilities = GambitCapabilities,
    bridgeTurn = GambitBridgeTurn, store = null,
  }) {
    this._svc = llmServerService;
    this._router = chatRouter;
    this._runner = runner;
    this._capabilities = capabilities;
    this._bridgeTurn = bridgeTurn;
    this._store = store || new GambitResultStore(llmServerService.settingsDb);
  }

  get id() {
    return CompatibilityGambit.ID;
  }

  describe() {
    return {
      id: CompatibilityGambit.ID,
      label: CompatibilityGambit.LABEL,
      description: CompatibilityGambit.DESCRIPTION,
      duration: CompatibilityGambit.DURATION,
      taskCount: this._runner.loadSuite().length,
    };
  }

  async run({ target, options, startedAt, isAborted, onProgress }) {
    const settings = CompatibilityGambit.options(options);
    const capabilities = await this._capabilities.detect();
    const fullSuite = this._runner.loadSuite();
    const tasks = CompatibilityGambit.filterSuite(fullSuite, settings.filter);
    if (!tasks) throw new Error(CompatibilityGambit.NO_MATCH);
    const filtered = tasks.length !== fullSuite.length;
    onProgress({ phase: 'resolved', total: tasks.length, capabilities: capabilities.caps, capabilityReasons: capabilities.reasons, filtered });
    const report = await this._runner.runGambit({
      tasks,
      runTurn: this._bridgeTurn.create({ bridge: this._router.agentBridge, deps: target.deps, modelRef: target.modelRef, ...CompatibilityGambit._experiments(settings) }),
      capabilities,
      isAborted,
      onProgress,
      meta: GambitProvenance.meta({ llmServerService: this._svc, defaults: target.defaults, livePath: target.livePath, modelRef: target.modelRef, modelLabel: target.modelLabel, startedAt, filtered, options: settings }),
    });
    GambitProvenance.noteContextDrift(report, this._svc, target.defaults);
    return report;
  }

  results() {
    return this._store.all();
  }

  save(modelPath, report, ranAt) {
    if (!GambitProvenance.isPersistable(report.meta)) return null;
    const saved = this._store.save(modelPath, { report, canceled: report.aborted, ranAt });
    return (saved && saved.ranAt) || null;
  }

  static options(options) {
    const {
      filter = null, nativeHistory = false, nativeTools = null, agentEffort = null, parallel = null,
      promptExperiments = null,
    } = options || {};
    return { filter, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments };
  }

  static filterSuite(suite, filter) {
    if (!filter || !(Array.isArray(filter.groups) || Array.isArray(filter.taskIds))) return suite;
    const groups = new Set(filter.groups || []);
    const ids = new Set(filter.taskIds || []);
    const tasks = (groups.size || ids.size) ? suite.filter((t) => groups.has(t.group) || ids.has(t.id)) : suite;
    return tasks.length ? tasks : null;
  }

  static _experiments({ nativeHistory, nativeTools, agentEffort, parallel, promptExperiments }) {
    return { nativeHistory, nativeTools, agentEffort, parallel, promptExperiments };
  }
}

module.exports = CompatibilityGambit;
