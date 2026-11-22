const os = require('os');
const PlanFor = require('../server/PlanFor');
const ByteLadder = require('../server/ByteLadder');
const UnsupportedFlagMemory = require('../server/UnsupportedFlagMemory');
const LaunchContext = require('../server/launcher/LaunchContext');
const LaunchOverrides = require('../server/launcher/LaunchOverrides');
const StartPlanPreview = require('../server/launcher/StartPlanPreview');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');

class LlmPinPlanCheck {
  constructor({
    planFor = PlanFor.shared,
    preview = new StartPlanPreview({ planFor, catalog: LlmRuntimeCatalog.shared }),
    freeMemory = () => os.freemem(),
    liveMemory = (diagnostics) => CudaDeviceProbe.withLiveMemory(diagnostics),
  } = {}) {
    this._planFor = planFor;
    this._preview = preview;
    this._freeMemory = freeMemory;
    this._liveMemory = liveMemory;
  }

  async refusal(service, model, pin) {
    try {
      const ctx = await this._launchContext(service, model);
      if (!ctx) return null;
      ctx.overrides.ramPin = { freeBytes: this._freeBesidePin(pin) };
      const plan = this._preview.plan({
        model, runtime: ctx.runtime, diagnostics: ctx.diag, settingsDb: ctx.settingsDb, overrides: ctx.overrides,
      });
      return plan.ramPinSlowsDecode ? LlmPinPlanCheck._message(model, plan) : null;
    } catch (_) {
      return null;
    }
  }

  async _launchContext(service, model) {
    if (!LlmPinPlanCheck._canPlan(service)) return null;
    const ctx = new LaunchContext({ service, planFor: this._planFor });
    const diagnostics = await service.ensureDiagnostics();
    ctx.runtime = await LlmPinPlanCheck._runtime(service, model, diagnostics);
    if (!ctx.runtime) return null;
    ctx.model = model;
    ctx.diag = this._cardsAsStartFindsThem(service, diagnostics);
    LaunchOverrides.apply(ctx, { freeMemory: this._freeMemory });
    return ctx;
  }

  static _canPlan(service) {
    return typeof service.ensureRuntimesView === 'function' && typeof service.ensureDiagnostics === 'function';
  }

  static async _runtime(service, model, diagnostics) {
    const runtimesView = await service.ensureRuntimesView();
    const outcome = service.runtimeChooser.forModel(model, { runtimesView, diagnostics });
    return outcome.runtime ? UnsupportedFlagMemory.withLearnedFlags(outcome.runtime, service.settingsDb) : null;
  }

  _cardsAsStartFindsThem(service, diagnostics) {
    const live = this._liveMemory(diagnostics);
    return service.residentVram ? service.residentVram.withoutOwn(live) : live;
  }

  _freeBesidePin({ pinBytes, pinnedAlready }) {
    const free = this._freeMemory();
    return pinnedAlready ? free : Math.max(0, free - (Number(pinBytes) || 0));
  }

  static _message(model, plan) {
    const pool = plan.moeSplit && plan.moeSplit.expertBytes ? ` (${ByteLadder.format(plan.moeSplit.expertBytes)})` : '';
    return `Not pinned: ${model.displayName || model.name} keeps its expert weights${pool} in RAM for the GPU to read, `
      + 'and reading them from the pinned file would about halve generation speed. '
      + 'There is not enough free RAM to hold them a second time beside the pin.';
  }
}

module.exports = LlmPinPlanCheck;
