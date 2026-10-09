const path = require('path');
const LocalRestartDecision = require('./LocalRestartDecision');
const LaunchErrorHints = require('./LaunchErrorHints');

class LocalServerPrep {
  static NOT_CONFIGURED = 'No local model configured. Pick a runtime + model in Setup.';

  constructor({ llmServerService, launcher, scanner, imageServerService }) {
    this._service = llmServerService;
    this._launcher = launcher;
    this._scanner = scanner;
    this._imageServerService = imageServerService;
  }

  async prepare(wantBasename, imageCount, hooks, log) {
    const defaults = this._configuredDefaults();
    const switched = await this._switchModelIfAsked(wantBasename, defaults, log);
    const server = this._service.runtimeServer;
    const status = server.getStatus();
    const dirty = !!server.dirty;
    const decision = LocalRestartDecision.decide({ switched, defaults, status, dirty, imageCount });
    if (decision.reason) await this._restart(decision, status, dirty, hooks, log);
    else LocalServerPrep._logReady(status, decision, log);
    server.markActive();
  }

  _configuredDefaults() {
    const defaults = this._service.getDefaults();
    if (!defaults.runtimeId || !defaults.modelPath) throw new Error(LocalServerPrep.NOT_CONFIGURED);
    return defaults;
  }

  async _switchModelIfAsked(wantBasename, defaults, log) {
    const current = LocalServerPrep._stem(defaults.modelPath);
    if (!wantBasename || wantBasename === current) return false;
    log.line(`model switch requested: ${current} → ${wantBasename}`);
    const scan = await this._scanner.scan(this._service.getModelsDirConfig().effectivePath);
    const match = (scan.models || []).find((m) => {
      const weight = m.weights && m.weights[0];
      return !!(weight && weight.path) && LocalServerPrep._stem(weight.path) === wantBasename;
    });
    if (!match) throw new Error(`Local model "${wantBasename}" was not found in the models directory.`);
    this._service.setDefaults({ modelPath: match.weights[0].path });
    return true;
  }

  async _restart(decision, status, dirty, hooks, log) {
    log.line(`RESTART triggered (${decision.reason}): state=${status.state} dirty=${dirty} desiredCtx=${decision.desiredCtx} runningReq=${decision.runningCtx} wantVision=${decision.wantVision} haveVision=${decision.haveVision}`);
    hooks.onStatus({ phase: decision.reason });
    let result = await this._stopThenStart(decision.wantVision, log, 'server (re)start');
    if (!(result && result.success)) result = await this._retryAfterImageReclaim(result, decision.wantVision, hooks, log);
    if (!(result && result.success)) throw LaunchErrorHints.errorFrom(result);
  }

  async _stopThenStart(withVision, log, label) {
    try { await this._service.runtimeServer.ensureStopped(); } catch (_) {}
    const startedAt = Date.now();
    let result;
    try { result = await this._launcher.resolveAndStart(this._service, { withVision }); }
    catch (err) { result = LaunchErrorHints.failureFrom(err); }
    log.line(`${label} took ${Date.now() - startedAt}ms, success=${result && result.success}`);
    return result;
  }

  async _retryAfterImageReclaim(failed, withVision, hooks, log) {
    const images = this._imageServerService ? this._imageServerService() : null;
    if (!images || typeof images.shutdown !== 'function') return failed;
    log.line(`LLM start failed (${(failed && failed.error) || 'unknown'}): stopping image servers to reclaim VRAM and retrying once`);
    hooks.onStatus({ phase: 'reclaiming-vram' });
    try { await images.shutdown(); } catch (_) {}
    return this._stopThenStart(withVision, log, 'server retry after image reclaim');
  }

  static _logReady(status, decision, log) {
    const p = status.plan || {};
    const partial = p.partial ? p.partial.ngl + '/' + p.partial.layerCount : 'none';
    log.line(`server already ready: port=${status.port} ctx(plan)=${p.contextSize} ctx(req)=${decision.runningCtx} ngl=${p.ngl} fullOffload=${p.fullOffload} partial=${partial} fa=${p.flashAttn} swa-full=${p.swaFull} kv=K:${p.cacheTypeK || 'f16'}/V:${p.cacheTypeV || 'f16'}`);
  }

  static _stem(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }
}

module.exports = LocalServerPrep;
