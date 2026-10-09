const TestAgentRunner = require('./TestAgentRunner');
const TestRunLog = require('./TestRunLog');
const TestHarnessApi = require('./TestHarnessApi');

class TestExecutor {
  static DEFAULT_TIMEOUT_MS = 300000;
  static DEFAULT_MAX_ITERATIONS = 15;
  static DEFAULT_SLOT_ID = 'ai-chat.navigator';
  static TIMEOUT_SENTINEL = '__TEST_TIMEOUT__';

  constructor(llmService, repository, services) {
    this.llm = llmService;
    this.repository = repository;
    this.services = services;
  }

  async run(descriptor, variant, options = {}) {
    const config = (variant && variant.config) || {};
    const log = new TestRunLog(descriptor.id, (variant && variant.id) || '', config);
    this._persistSummary(log);
    const runner = this._createRunner(log, config, options.onProgress);
    await this._runDescriptor(descriptor, TestHarnessApi.build(runner, log, config), log);
    if (log.status === 'running') log.complete(null);
    this._persistSummary(log);
    this._persistFullLog(log);
    return log;
  }

  _createRunner(log, config, onProgress) {
    return new TestAgentRunner(this.llm, this.services, {
      maxIterations: config.maxIterations || TestExecutor.DEFAULT_MAX_ITERATIONS,
      slotId: config.slotId || TestExecutor.DEFAULT_SLOT_ID,
      onProgress: (progress) => {
        if (onProgress) onProgress({ runId: log.runId, ...progress });
      },
    });
  }

  async _runDescriptor(descriptor, harness, log) {
    const timeout = TestExecutor._timeout(descriptor.timeout || TestExecutor.DEFAULT_TIMEOUT_MS);
    try {
      await Promise.race([descriptor.run(harness), timeout.promise]);
    } catch (err) {
      if (err.message === TestExecutor.TIMEOUT_SENTINEL) log.timeout();
      else log.fail(err);
    } finally {
      timeout.cancel();
    }
  }

  _persistSummary(log) {
    try {
      this.repository.saveSummary(log.toSummary());
    } catch (err) {
      console.error('TestExecutor: failed to save run summary:', err.message);
    }
  }

  _persistFullLog(log) {
    try {
      this.repository.saveFullLog(log.toFullLog());
    } catch (err) {
      console.error('TestExecutor: failed to save run log:', err.message);
    }
  }

  static _timeout(ms) {
    let timer = null;
    const promise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(TestExecutor.TIMEOUT_SENTINEL)), ms);
    });
    return { promise, cancel: () => clearTimeout(timer) };
  }
}

module.exports = TestExecutor;
