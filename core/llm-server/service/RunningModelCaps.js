const ModelCapsCache = require('../server/ModelCapsCache');
const ReasoningEffort = require('../../shared/llm/ReasoningEffort');

class RunningModelCaps {
  static SERVING_STATES = Object.freeze(['ready', 'starting']);

  constructor({ runtimeServer, capsCache, getDefaultModelPath }) {
    this._rs = runtimeServer;
    this._capsCache = capsCache;
    this._getDefaultModelPath = getDefaultModelPath;
  }

  runningModelPath(status) {
    if (status && status.modelPath) return status.modelPath;
    if (status && RunningModelCaps.SERVING_STATES.includes(status.state)) return this._getDefaultModelPath() || null;
    return null;
  }

  get(modelPath) {
    const target = (typeof modelPath === 'string' && modelPath) || this._getDefaultModelPath() || null;
    if (!target) return null;
    return this._fromCache(target) || this._fromLiveProbe(target);
  }

  runningThinking() {
    try {
      const status = this._rs.getStatus();
      if (!status || status.state !== 'ready' || !status.caps) return null;
      return status.caps.thinking || null;
    } catch (_) {
      return null;
    }
  }

  rememberRunning() {
    const status = this._rs.getStatus();
    const running = this.runningModelPath(status);
    if (running) this._capsCache.remember(running, status.caps);
  }

  _fromCache(target) {
    const cached = this._capsCache.recall(target);
    if (!cached) return null;
    return RunningModelCaps._caps(cached.reasoningEffort, cached.thinking || null, 'cache');
  }

  _fromLiveProbe(target) {
    const status = this._rs.getStatus();
    const running = this.runningModelPath(status);
    if (!running || ModelCapsCache.modelKeyOf(running) !== ModelCapsCache.modelKeyOf(target)) return null;
    if (!status.caps || typeof status.caps.reasoningEffort !== 'boolean') return null;
    return RunningModelCaps._caps(status.caps.reasoningEffort, status.caps.thinking || null, 'live');
  }

  static _caps(reasoningEffort, thinking, source) {
    return { reasoningEffort, reasoningDial: ReasoningEffort.dialPositionsFor(thinking), thinking, source };
  }
}

module.exports = RunningModelCaps;
