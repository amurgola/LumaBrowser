const UnsupportedFlagMemory = require('../UnsupportedFlagMemory');
const FailureInterpreter = require('../FailureInterpreter');

class FlagRescue {
  constructor({ finalizer, log }) {
    this._finalizer = finalizer;
    this._log = log;
  }

  async attempt(ctx, err, failure) {
    const badFlag = FlagRescue._plannerEmittedFlag(ctx.launch, err, failure);
    if (!badFlag || !UnsupportedFlagMemory.remember(ctx.runtime, badFlag, ctx.settingsDb)) return null;
    this._log.warn(`[llm-server] ${ctx.runtime.name} rejected ${badFlag}; remembered as unsupported for build ${ctx.runtime.version || 'unknown'}.`);
    if (ctx.rpcAcquired) return null;
    return this._retryWithout(ctx, badFlag);
  }

  static _plannerEmittedFlag(launch, err, failure) {
    const message = err && err.message;
    const badFlag = failure && failure.kind === 'unknown-flag' ? FailureInterpreter.extractUnknownFlag(message) : null;
    if (!badFlag) return null;
    const userArgs = launch.plan && launch.plan.userArgs;
    if (Array.isArray(userArgs) && userArgs.includes(badFlag)) return null;
    return Array.isArray(launch.args) && launch.args.includes(badFlag) ? badFlag : null;
  }

  async _retryWithout(ctx, badFlag) {
    try { await ctx.runtimeServer.ensureStopped(); } catch (_) {}
    const runtime = UnsupportedFlagMemory.withLearnedFlags(ctx.runtimeRow, ctx.settingsDb);
    const rescue = this._finalizer.finalize(ctx, ctx.plan({ diagnostics: ctx.planDiag, runtime }));
    if (rescue.plan && Array.isArray(rescue.plan.notes)) {
      rescue.plan.notes.push(`Flag rescue: ${ctx.runtime.name} rejected ${badFlag} on the first start, so this launch was replanned without it (remembered for this build).`);
    }
    await ctx.runtimeServer.start(rescue);
    ctx.syncQueue(rescue.plan);
    return ctx.succeed(rescue.plan, { flagRescue: badFlag });
  }
}

module.exports = FlagRescue;
