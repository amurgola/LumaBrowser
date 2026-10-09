const CdpError = require('../CdpError');

class CommandForwarder {
  constructor(server) {
    this._server = server;
  }

  async forward(method, params, session) {
    if (!session) throw new CdpError(CdpError.CODE.METHOD_NOT_FOUND, `'${method}' requires a session; attach to a target first`);
    const target = this._targetOf(session);
    try {
      return await this._server.debugger.sendCommand(target.tabId, method, params || {});
    } catch (e) {
      throw CdpError.server(e && e.message ? e.message : String(e));
    }
  }

  _targetOf(session) {
    const target = this._server.targets.get(session.targetId);
    if (!target) throw CdpError.internal(`Session ${session.sessionId} references unknown target ${session.targetId}`);
    return target;
  }
}

module.exports = CommandForwarder;
