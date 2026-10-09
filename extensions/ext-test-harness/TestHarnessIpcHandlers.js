const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');

class TestHarnessIpcHandlers {
  static register(ipc, service) {
    ipc.handle('discoverTests', async () => service.discoverTests());
    ipc.handle('runTest', async (_event, testId, variantId) => service.startTest(testId, variantId));
    ipc.handle('getTestRuns', async (_event, limit = 50, offset = 0) => service.getTestRuns(limit, offset));
    ipc.handle('getTestRunDetail', async (_event, runId) => service.getTestRunDetail(runId));
    ipc.handle('deleteTestRun', IpcEnvelope.enveloped((_event, runId) => ({ success: service.deleteTestRun(runId) })));
    ipc.handle('clearAllRuns', IpcEnvelope.enveloped(() => service.clearAllRuns()));
  }
}

module.exports = TestHarnessIpcHandlers;
