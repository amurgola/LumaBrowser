class MusicServerGate {
  constructor(musicServerService) {
    this._svc = musicServerService;
    this._server = musicServerService.server;
    this._model = null;
    this._send = null;
    this._status = null;
    this._cold = false;
  }

  async ensureServing(model, send) {
    this._setupRequest(model, send);
    await this._waitForPendingStart();
    const startError = await this._startIfNeeded();
    if (startError) return this._failed(startError);
    if (!this._isReady()) return this._failed(`Music server is ${this._status.state}, not ready.`);
    this._server.markActive();
    return { status: this._status, cold: this._cold };
  }

  _setupRequest(model, send) {
    this._model = model;
    this._send = send;
    this._status = this._server.getStatus();
    this._cold = false;
  }

  _needsSwitch() {
    const runningModelId = this._status.plan && this._status.plan.modelId;
    return Boolean(runningModelId && runningModelId !== this._model.id);
  }

  async _waitForPendingStart() {
    if (this._status.state !== 'starting' || this._needsSwitch()) return;
    this._send('status', { phase: 'starting-server' });
    await this._server.waitUntilSettled();
    this._status = this._server.getStatus();
  }

  async _startIfNeeded() {
    const needSwitch = this._needsSwitch();
    if (this._status.state === 'ready' && !needSwitch) return null;
    this._cold = true;
    this._send('status', { phase: needSwitch ? 'switching-model' : 'starting-server' });
    await this._stopRunningServer();
    const result = await this._svc.startServerResolved(this._model.id);
    if (!result || !result.success) return (result && result.error) || 'Failed to start the music server.';
    this._status = this._server.getStatus();
    return null;
  }

  async _stopRunningServer() {
    if (this._status.state !== 'ready' && this._status.state !== 'starting') return;
    try {
      await this._server.stop();
    } catch (_) {}
  }

  _isReady() {
    return this._status.state === 'ready' && Boolean(this._status.port);
  }

  _failed(message) {
    this._send('error', { message });
    return { error: message };
  }
}

module.exports = MusicServerGate;
