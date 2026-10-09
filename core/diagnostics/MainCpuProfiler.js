const CpuProfiler = require('./CpuProfiler');

class MainCpuProfiler extends CpuProfiler {
  constructor({ createSession = MainCpuProfiler._newSession } = {}) {
    super();
    this._createSession = createSession;
    this._session = null;
  }

  async _attach() {
    this._session = this._createSession();
    this._session.connect();
  }

  _send(method, params) {
    return new Promise((resolve, reject) => {
      this._session.post(method, params || {}, (err, result) => (err ? reject(err) : resolve(result)));
    });
  }

  _detach() {
    this._session.disconnect();
  }

  static _newSession() {
    const { Session } = require('inspector');
    return new Session();
  }
}

module.exports = MainCpuProfiler;
