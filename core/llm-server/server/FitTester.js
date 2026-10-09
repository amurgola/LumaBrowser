const PlanFor = require('./PlanFor');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const FitComboLadder = require('./fit-test/FitComboLadder');
const FitComboRunner = require('./fit-test/FitComboRunner');
const FitRunSignals = require('./fit-test/FitRunSignals');
const DepthProbe = require('./fit-test/DepthProbe');

class FitTester {
  static CTX_LADDER = FitComboLadder.CTX_LADDER;
  static KV_VARIANTS = FitComboLadder.KV_VARIANTS;
  static DEPTH_TARGET_TOKENS = DepthProbe.TARGET_TOKENS;
  static DEPTH_MIN_CTX = DepthProbe.MIN_CTX;

  static shared = new FitTester();

  constructor({ planFor = PlanFor.shared, catalog = LlmRuntimeCatalog.shared, comboRunner = null } = {}) {
    this._planFor = planFor;
    this._catalog = catalog;
    this._comboRunner = comboRunner || new FitComboRunner({ planFor });
  }

  async run(options = {}) {
    const catalogEntry = this._assertRunnable(options);
    const signals = new FitRunSignals(options);
    const combos = FitComboLadder.build(options.model);
    const job = FitTester._jobBase(options, catalogEntry, signals);
    return this._runCombos(combos, job, signals);
  }

  _assertRunnable({ model, runtime }) {
    if (!model) throw new Error('FitTester: model is required');
    if (!runtime || !runtime.binaryPath) throw new Error('FitTester: an installed runtime with a binaryPath is required');
    if (Array.isArray(runtime.unsupportedFlags) && runtime.unsupportedFlags.includes('--flash-attn')) {
      throw new Error(`${runtime.name} can't accept --flash-attn, which the fit test forces. Pick a llama.cpp runtime.`);
    }
    const entry = this._catalog.getById(runtime.id);
    FitTester._assertLlamaLaunch(runtime, entry, this._planFor.isCustomLaunch(entry));
    return entry;
  }

  static _assertLlamaLaunch(runtime, entry, custom) {
    if (PlanFor.isMlx(entry)) {
      throw new Error(`${runtime.name} runs on Apple Silicon unified memory, so there is no discrete-VRAM layer split for the fit test to measure. The model picker's estimate already reflects that MLX models run fully on the GPU.`);
    }
    if (custom) {
      throw new Error(`${runtime.name} has no llama.cpp layer-offload surface for the fit test to sweep; its planner sizes the context against the card directly.`);
    }
  }

  static _jobBase(options, catalogEntry, signals) {
    const apiKey = (typeof options.apiKey === 'string' && options.apiKey.length > 0) ? options.apiKey : null;
    return {
      model: options.model,
      runtime: options.runtime,
      catalogEntry,
      diagnostics: options.diagnostics,
      resolveDevice: options.resolveDevice,
      priorFit: options.priorFit,
      apiKey,
      cancelled: signals.cancelled,
    };
  }

  async _runCombos(combos, job, signals) {
    const total = combos.length;
    signals.emit({ phase: 'start', index: 0, total, combo: null, result: null });
    const results = [];
    for (let i = 0; i < combos.length; i++) {
      if (signals.cancelled()) {
        signals.emit({ phase: 'canceled', index: i, total, combo: null, result: null });
        return { ok: true, canceled: true, results };
      }
      const combo = combos[i];
      signals.emit({ phase: 'combo-start', index: i, total, combo, result: null });
      const result = await this._comboRunner.run({ ...job, combo });
      results.push(result);
      signals.emit({ phase: 'combo-done', index: i + 1, total, combo, result });
    }
    signals.emit({ phase: 'done', index: total, total, combo: null, result: null });
    return { ok: true, canceled: false, results };
  }
}

module.exports = FitTester;
