const CdpError = require('./CdpError');

class CdpFrameHandler {
  constructor(sessions, dispatcher) {
    this._sessions = sessions;
    this._dispatcher = dispatcher;
  }

  async handle(connection, data) {
    const frame = CdpFrameHandler._parse(data);
    if (!frame) return connection.send({ id: null, error: { code: CdpError.CODE.PARSE_ERROR, message: 'Parse error' } });
    const { id, sessionId, method, params } = frame;
    if (typeof id !== 'number' || !method) {
      return connection.send({ id: id || null, error: { code: CdpError.CODE.INVALID_REQUEST, message: 'Invalid request' } });
    }
    const session = this._sessionFor(connection, sessionId);
    if (sessionId && !session) {
      return connection.send({ id, sessionId, error: { code: CdpError.CODE.INVALID_PARAMS, message: `Session ${sessionId} not found` } });
    }
    connection.send(await this._reply(id, sessionId, method, params, { connection, session }));
  }

  _sessionFor(connection, sessionId) {
    const effectiveId = sessionId || connection.implicitSessionId || null;
    return effectiveId ? this._sessions.get(effectiveId) : null;
  }

  async _reply(id, sessionId, method, params, scope) {
    const reply = { id };
    try {
      reply.result = await this._dispatcher.dispatch(method, params || {}, scope);
    } catch (err) {
      reply.error = CdpError.serialize(err);
    }
    if (sessionId) reply.sessionId = sessionId;
    return reply;
  }

  static _parse(data) {
    try {
      return JSON.parse(data.toString('utf8')) || {};
    } catch (_) {
      return null;
    }
  }
}

module.exports = CdpFrameHandler;
