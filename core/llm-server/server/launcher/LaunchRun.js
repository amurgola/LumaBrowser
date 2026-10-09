const FailureInterpreter = require('../FailureInterpreter');
const LaunchContext = require('./LaunchContext');
const LaunchOverrides = require('./LaunchOverrides');

class LaunchRun {
  static LENDING_WAIT_MS = 30000;

  constructor(parts, service, options = {}) {
    this._parts = parts;
    this._ctx = new LaunchContext({ service, planFor: parts.planFor, withVision: options.withVision });
    this._timings = {};
    this._hotswapReclaim = null;
  }

  async execute() {
    const missing = this._refuseMissingDefaults();
    if (missing) return missing;
    await this._stopLeftoverChild();
    this._startHotswapReclaim();
    const refusal = await this._parts.preflight.resolve(this._ctx, this._timings);
    if (refusal) return refusal;
    await this._prepareOverrides();
    if (this._isCustomLaunch()) return this._startCustomLaunch();
    await this._waitForLentGpus();
    await this._parts.borrow.borrow(this._ctx);
    await this._joinHotswapReclaim();
    this._parts.placement.place(this._ctx);
    await this._planLaunch();
    await this._preferExpertOffloadOverPeers();
    this._parts.finalizer.finalize(this._ctx, this._ctx.launch);
    return this._startWithRescues();
  }

  _refuseMissingDefaults() {
    const defaults = this._ctx.defaults;
    if (!defaults.runtimeId) return { success: false, error: 'No default runtime selected.' };
    if (!defaults.modelPath) return { success: false, error: 'No default model selected.' };
    return null;
  }

  async _stopLeftoverChild() {
    try {
      const server = this._ctx.runtimeServer;
      if (server && server.getStatus().state !== 'ready') await server.ensureStopped();
    } catch (_) {}
  }

  _startHotswapReclaim() {
    this._timings.preflight = Date.now();
    this._hotswapReclaim = this._parts.hotswap.acquire('llm').catch(() => {});
  }

  async _prepareOverrides() {
    const ctx = this._ctx;
    ctx.port = await this._parts.findFreePort();
    LaunchOverrides.apply(ctx, { freeMemory: this._parts.freeMemory });
    ctx.catalogEntry = this._parts.catalog.getById(ctx.runtime.id);
  }

  _isCustomLaunch() {
    return this._parts.planFor.isCustomLaunch(this._ctx.catalogEntry);
  }

  async _startCustomLaunch() {
    const ctx = this._ctx;
    const launch = ctx.plan();
    await this._hotswapReclaim;
    await ctx.runtimeServer.start(launch);
    ctx.syncQueue(launch.plan);
    return ctx.succeed(launch.plan);
  }

  async _waitForLentGpus() {
    try {
      const lending = this._parts.lending();
      if (lending && lending.isActive && lending.isActive()) await lending.waitUntilFree(LaunchRun.LENDING_WAIT_MS);
    } catch (_) {}
  }

  async _joinHotswapReclaim() {
    const t = this._timings;
    t.plan = Date.now();
    await this._hotswapReclaim;
    this._parts.log.log(`[llm-server] launch preflight: diag ${t.diag - t.preflight}ms, runtimes ${t.runtimes - t.diag}ms, `
      + `scan ${t.scan - t.runtimes}ms, plan ${t.plan - t.scan}ms, evict-join ${Date.now() - t.plan}ms`);
  }

  async _planLaunch() {
    const ctx = this._ctx;
    try {
      ctx.launch = ctx.plan({ diagnostics: ctx.planDiag });
    } catch (err) {
      await this._parts.borrow.release(ctx);
      throw err;
    }
  }

  async _preferExpertOffloadOverPeers() {
    const ctx = this._ctx;
    if (!ctx.rpcAcquired || !ctx.launch.plan || !ctx.launch.plan.cpuMoe) return;
    await this._parts.borrow.release(ctx);
    ctx.rpcAcquired = false;
    delete ctx.overrides.rpcServers;
    ctx.overrides.rpcSkippedMoeOffload = true;
    this._parts.log.log('[llm-server] peer GPUs returned: model runs MoE expert-offload, which is faster local-only.');
    ctx.launch = ctx.plan({ diagnostics: ctx.planDiag });
  }

  async _startWithRescues() {
    const ctx = this._ctx;
    try {
      await ctx.runtimeServer.start(ctx.launch);
    } catch (err) {
      return this._rescueOrRethrow(err);
    }
    ctx.syncQueue(ctx.launch.plan);
    return ctx.succeed(ctx.launch.plan);
  }

  async _rescueOrRethrow(err) {
    const ctx = this._ctx;
    await this._parts.borrow.release(ctx);
    const failure = FailureInterpreter.interpret(err && err.message);
    const flagRescued = await this._parts.flagRescue.attempt(ctx, err, failure);
    if (flagRescued) return flagRescued;
    const oomRescued = await this._parts.oomRescue.attempt(ctx, failure);
    if (oomRescued) return oomRescued;
    throw err;
  }
}

module.exports = LaunchRun;
