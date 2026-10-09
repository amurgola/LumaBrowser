class WatcherTestRun {
  static SAMPLES = {
    ipc: { headerName: 'Test', body: '{"test": true, "message": "This is a test response from Network Watcher"}' },
    api: { headerName: 'X-Test', body: '{"test": true, "message": "This is a test response from Network Watcher API"}' },
  };

  constructor(watcherService, { now = () => new Date() } = {}) {
    this._service = watcherService;
    this._now = now;
  }

  async execute(config, sample) {
    const tempWatcher = this._service.addWatcher({ ...config, note: `[TEST] ${config.note || ''}` });
    try {
      return await this._service.forwardToWebhook(tempWatcher, this._captureFor(config, WatcherTestRun.SAMPLES[sample]));
    } finally {
      this._service.removeWatcher(tempWatcher.id);
    }
  }

  _captureFor(config, sample) {
    return {
      url: config.urlPattern,
      method: config.method || 'GET',
      timestamp: this._now().toISOString(),
      request: { headers: { [sample.headerName]: 'true' } },
      response: {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: sample.body,
        base64Encoded: false,
      },
    };
  }
}

module.exports = WatcherTestRun;
