const LocalRequest = require('./LocalRequest');
const StreamPhaseLog = require('./StreamPhaseLog');

class HelperStream {
  static NOT_READY = 'Helper model is not ready.';

  constructor({ helper, runtimeCatalog, adapterRegistry, request = null }) {
    this._helper = helper;
    this._request = request || new LocalRequest({ llmServerService: helper.facade(), runtimeCatalog, adapterRegistry });
  }

  async stream(stem, messages, temperature, hooks, images = [], tools = null, extra = null) {
    if (!this._helper || !this._helper.readyRef()) throw new Error(HelperStream.NOT_READY);
    const log = new StreamPhaseLog();
    log.line(`helper ${stem}`);
    return this._request.send(messages, temperature, hooks, images, tools, extra, log);
  }
}

module.exports = HelperStream;
