class LlmDiagnosticsView {
  constructor(llmServerService) {
    this._svc = llmServerService;
  }

  async diagnostics(options) {
    const force = !!(options && options.force);
    const fromCache = !force && !!this._svc.getCachedDiagnostics();
    const data = await this._svc.ensureDiagnostics({ force });
    return { data, fromCache, vramPressure: this._svc.getVramPressure() };
  }

  resetNvidiaSmiPathHint() {
    this._svc.setNvidiaSmiPathHintDismissed(false);
    this._svc.setSavedNvidiaSmiPath(null);
  }
}

module.exports = LlmDiagnosticsView;
