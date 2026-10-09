const ExtensionGlobals = require('./ExtensionGlobals');

class ImageVramMediator {
  static RESTORE_DELAY_MS = 6000;
  static LIVE_STATES = ['ready', 'starting'];

  static shared = new ImageVramMediator();

  constructor({ gpuCount, llmService, imageService, startLlm, delayMs = ImageVramMediator.RESTORE_DELAY_MS } = {}) {
    this._gpuCount = gpuCount || ImageVramMediator._liveGpuCount;
    this._llmService = llmService || ExtensionGlobals.llmServerService;
    this._imageService = imageService || ExtensionGlobals.imageServerService;
    this._startLlm = startLlm || ImageVramMediator._resolveAndStartLlm;
    this._delayMs = delayMs;
    this._refcount = 0;
    this._llmWasRunning = false;
    this._restoreTimer = null;
  }

  async begin() {
    if (this._isMultiGpu()) return;
    this._refcount += 1;
    this._cancelRestore();
    if (this._refcount === 1) await this._stopLlm();
  }

  end() {
    if (this._isMultiGpu()) return;
    this._refcount = Math.max(0, this._refcount - 1);
    if (this._refcount !== 0) return;
    this._cancelRestore();
    this._restoreTimer = setTimeout(() => {
      this._restoreTimer = null;
      if (this._refcount === 0) this._restore();
    }, this._delayMs);
  }

  _isMultiGpu() {
    try { return this._gpuCount() >= 2; } catch (_) { return false; }
  }

  _cancelRestore() {
    if (!this._restoreTimer) return;
    clearTimeout(this._restoreTimer);
    this._restoreTimer = null;
  }

  async _stopLlm() {
    const llm = this._llmService();
    if (!llm || !llm.runtimeServer) return;
    if (!ImageVramMediator.LIVE_STATES.includes(ImageVramMediator._stateOf(llm.runtimeServer))) return;
    this._llmWasRunning = true;
    try {
      await llm.runtimeServer.stop();
      console.log('[img-vram] stopped LLM server to free VRAM for image generation');
    } catch (_) {}
  }

  async _restore() {
    await this._stopImageServers();
    await this._restartLlm();
  }

  async _stopImageServers() {
    try {
      const image = this._imageService();
      if (!image) return;
      if (image.runtimeServer) {
        await image.runtimeServer.stop();
        console.log('[img-vram] stopped image server (generate)');
      }
      if (image.editRuntimeServer) {
        try { await image.editRuntimeServer.stop(); } catch (_) {}
      }
    } catch (_) {}
  }

  async _restartLlm() {
    if (!this._llmWasRunning) return;
    this._llmWasRunning = false;
    try {
      await this._startLlm(this._llmService());
      console.log('[img-vram] restarted LLM server');
    } catch (e) {
      console.log('[img-vram] LLM restart failed:', e && e.message);
    }
  }

  static _stateOf(server) {
    try {
      const status = server.getStatus();
      return status && status.state;
    } catch (_) {
      return null;
    }
  }

  static _liveGpuCount() {
    return require('../../shared/runtime/CudaDeviceProbe').gpuCount();
  }

  static _resolveAndStartLlm(llmServerService) {
    return require('../../llm-server/server/ServerLauncher').shared.resolveAndStart(llmServerService);
  }
}

module.exports = ImageVramMediator;
