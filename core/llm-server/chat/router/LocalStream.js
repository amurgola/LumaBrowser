const StreamPhaseLog = require('./StreamPhaseLog');

class LocalStream {
  constructor({ llmServerService, prep, request }) {
    this._service = llmServerService;
    this._prep = prep;
    this._request = request;
  }

  async stream(wantBasename, messages, temperature, hooks, images = [], tools = null, extra = null) {
    await this._awaitVisionSettled();
    const guarded = this._beginPrepare();
    try {
      return await this._prepareAndSend(wantBasename, messages, temperature, hooks, images, tools, extra);
    } finally {
      if (guarded) this._service.endLocalPrepare();
    }
  }

  async _prepareAndSend(wantBasename, messages, temperature, hooks, images, tools, extra) {
    const log = new StreamPhaseLog();
    await this._prep.prepare(wantBasename, images.length, hooks, log);
    return this._request.send(messages, temperature, hooks, images, tools, extra, log);
  }

  async _awaitVisionSettled() {
    if (this._service && typeof this._service.whenVisionSettled === 'function') await this._service.whenVisionSettled();
  }

  _beginPrepare() {
    const guarded = !!(this._service && typeof this._service.beginLocalPrepare === 'function');
    if (guarded) this._service.beginLocalPrepare();
    return guarded;
  }
}

module.exports = LocalStream;
