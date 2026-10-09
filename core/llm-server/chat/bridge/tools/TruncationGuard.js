const ApprovalGate = require('../../ApprovalGate');
const CallMarkers = require('../parsing/CallMarkers');
const CallRefusalText = require('./CallRefusalText');

class TruncationGuard {
  constructor({ pipeline, parser, toolSet, router }) {
    this._pipeline = pipeline;
    this._parser = parser;
    this._toolSet = toolSet;
    this._router = router;
  }

  async execute(name, params, browserService) {
    const lost = CallMarkers.lostArguments(params);
    if (lost) return { success: false, error: CallRefusalText.argumentsUnreadable(name, lost) };
    if (CallMarkers.wasCut(params)) return { success: false, error: CallRefusalText.argumentsCutOff(name) };
    const lastCallRepaired = this._parser.takeLastCallRepaired();
    const repaired = CallMarkers.isRepaired(params) || lastCallRepaired;
    if (repaired && ApprovalGate.requiresApproval(name, this._toolSet.mutatingDeclared)) {
      return { success: false, error: CallRefusalText.refusedTruncatedCall(name) };
    }
    const release = this._holdIdle();
    try {
      const res = await this._pipeline.execute(name, params, browserService);
      return repaired ? CallRefusalText.withTruncationWarning(res) : res;
    } finally {
      release();
    }
  }

  _holdIdle() {
    const svc = this._router && this._router.llmServerService;
    const runtimeServer = svc && svc.runtimeServer;
    return (runtimeServer && typeof runtimeServer.holdIdle === 'function') ? runtimeServer.holdIdle() : () => {};
  }
}

module.exports = TruncationGuard;
