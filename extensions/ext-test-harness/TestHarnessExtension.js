const path = require('path');
const TestDiscovery = require('./lib/TestDiscovery');
const TestExecutor = require('./lib/TestExecutor');
const TestRunRepository = require('./lib/TestRunRepository');
const TestHarnessService = require('./TestHarnessService');
const TestHarnessIpcHandlers = require('./TestHarnessIpcHandlers');

class TestHarnessExtension {
  constructor() {
    this._service = null;
  }

  async activate(context) {
    const repository = new TestRunRepository(context.db);
    repository.ensureTables();
    this._service = TestHarnessExtension._buildService(context, repository);
    console.log('ext-test-harness: activated');
    TestHarnessIpcHandlers.register(context.ipc, this._service);
    return TestHarnessExtension._publicApi(this._service);
  }

  async deactivate() {
    this._service = null;
  }

  static _buildService(context, repository) {
    const discovery = new TestDiscovery(path.join(context.extensionDir, '..'));
    const executor = new TestExecutor(context.llm, repository, { browserService: context.browser });
    return new TestHarnessService({ discovery, executor, repository });
  }

  static _publicApi(service) {
    return {
      discoverTests: () => service.discoverTests(),
      runTest: (testId, variantId) => service.runTest(testId, variantId),
      getTestRuns: (limit, offset) => service.getTestRuns(limit, offset),
      getTestRunDetail: (runId) => service.getTestRunDetail(runId),
      deleteTestRun: (runId) => service.deleteTestRun(runId),
    };
  }
}

module.exports = TestHarnessExtension;
