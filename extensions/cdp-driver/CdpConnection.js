class CdpConnection {
  static OPEN = 1;

  constructor(ws, { scope, targetId }) {
    this.ws = ws;
    this.scope = scope;
    this.scopedTargetId = targetId || null;
    this.implicitSessionId = null;
    this.discoverTargets = false;
    this.autoAttach = false;
    this.waitForDebuggerOnStart = false;
    this.flatten = true;
  }

  send(frame) {
    try {
      if (this.ws && this.ws.readyState === CdpConnection.OPEN) this.ws.send(JSON.stringify(frame));
    } catch (_) {}
  }

  wantsBroadcast(frame) {
    if (this.discoverTargets) return true;
    return !(frame.method && frame.method.startsWith('Target.'));
  }

  eventFrameFor(session, method, params) {
    const frame = { method, params };
    if (this.implicitSessionId !== session.sessionId) frame.sessionId = session.sessionId;
    return frame;
  }
}

module.exports = CdpConnection;
