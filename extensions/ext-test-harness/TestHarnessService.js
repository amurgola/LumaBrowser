class TestHarnessService {
  constructor({ discovery, executor, repository }) {
    this._discovery = discovery;
    this._executor = executor;
    this._repository = repository;
  }

  discoverTests() {
    return this._discovery.scan();
  }

  async runTest(testId, variantId, options = {}) {
    const loaded = this._discovery.loadTest(testId);
    if (!loaded) throw new Error(`Test "${testId}" not found`);
    return this._execute(loaded, variantId, options);
  }

  startTest(testId, variantId) {
    const loaded = this._discovery.loadTest(testId);
    if (!loaded) return { success: false, error: `Test "${testId}" not found` };
    this._execute(loaded, variantId, { onProgress: TestHarnessService._logProgress })
      .then((log) => console.log(`ext-test-harness: test "${testId}" ${log.status}: ${log.toSummary().summary}`))
      .catch((err) => console.error(`ext-test-harness: test "${testId}" crashed:`, err.message));
    return { success: true, message: `Test "${testId}" started${variantId ? ` (variant: ${variantId})` : ''}` };
  }

  getTestRuns(limit = 50, offset = 0) {
    return this._repository.list(limit, offset);
  }

  getTestRunDetail(runId) {
    return this._repository.detail(runId);
  }

  deleteTestRun(runId) {
    return this._repository.delete(runId);
  }

  clearAllRuns() {
    this._repository.clear();
  }

  _execute(loaded, variantId, options) {
    return this._executor.run(loaded.descriptor, TestHarnessService._variant(loaded.descriptor, variantId), options);
  }

  static _variant(descriptor, variantId) {
    if (!variantId) return null;
    return (descriptor.variants || []).find((v) => v.id === variantId);
  }

  static _logProgress(progress) {
    console.log(`ext-test-harness: [${progress.runId}] iteration ${progress.iteration}: ${progress.tool || 'thinking'} (${progress.status})`);
  }
}

module.exports = TestHarnessService;
