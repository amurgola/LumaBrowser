const BareArgumentRepair = require('../../BareArgumentRepair');
const ActivateToolsCall = require('../groups/ActivateToolsCall');
const AutoActivation = require('../groups/AutoActivation');
const CallMarkers = require('../parsing/CallMarkers');
const CallRefusalText = require('./CallRefusalText');

class ToolCallPipeline {
  constructor({ toolSet, loopMonitor, health, approval, dispatch }) {
    this._toolSet = toolSet;
    this._loopMonitor = loopMonitor;
    this._health = health;
    this._approval = approval;
    this._dispatch = dispatch;
  }

  async execute(name, params, browserService) {
    if (name === CallMarkers.MALFORMED_TOOL) return { success: false, error: CallRefusalText.MALFORMED_CALL };
    if (name === ActivateToolsCall.NAME) return ActivateToolsCall.execute(params, this._toolSet.groups);
    const activation = AutoActivation.check(name, params, this._toolSet.groups);
    if (activation && activation.bounce) return activation.bounce;
    const args = new BareArgumentRepair(this._toolSet.requiredArgs).repair(name, params);
    const outcome = await this._loopMonitor.attempt(name, args, () => this._admitAndRun(name, args, browserService));
    if (outcome.ran) AutoActivation.appendManual(outcome.result, activation);
    return outcome.result;
  }

  async _admitAndRun(name, params, browserService) {
    const refusal = await this._refusal(name, params);
    if (refusal) return { result: refusal, ran: false };
    return { result: await this._run(name, params, browserService), ran: true };
  }

  async _refusal(name, params) {
    const missing = this._toolSet.requiredArgs.refusal(name, params);
    if (missing) {
      this._health.noteMissingArgs();
      return missing;
    }
    return this._approval.check(name, params);
  }

  async _run(name, params, browserService) {
    const raw = await this._dispatch.dispatch(name, params, browserService);
    const result = this._toolSet.requiredArgs.withSoftMissingNote(raw, name, params);
    this._admitNewTools(result);
    return result;
  }

  _admitNewTools(result) {
    if (!result || typeof result !== 'object' || !result.toolCatalogChanged) return;
    const admitted = this._toolSet.admitCatalogChanges();
    if (!admitted.length) return;
    const groups = this._toolSet.groups;
    const keys = groups.keysOwning(admitted.map((t) => t.name));
    const note = `\n\nNow callable in this run: ${admitted.map((t) => t.name).join(', ')}. `
      + `Instructions:\n\n${groups.docsFor(keys)}`;
    if (typeof result.message === 'string') result.message += note;
    else if (typeof result.next === 'string') result.next += note;
    else result.message = note.trim();
  }
}

module.exports = ToolCallPipeline;
