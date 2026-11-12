class LabChat {
  constructor({ router, Harness = null }) {
    this._router = router;
    this._Harness = Harness;
  }

  async complete(opts) {
    const mocked = this._mock(opts);
    if (mocked != null) return mocked;
    try {
      return await this._router.complete(opts);
    } catch (e) {
      return { error: (e && e.message) || 'complete failed' };
    }
  }

  _mock(opts) {
    const lab = this._Harness && typeof this._Harness.current === 'function' ? this._Harness.current() : null;
    if (!lab || !lab.active || typeof lab.completeMock !== 'function') return null;
    try { return lab.completeMock(opts); } catch (_) { return null; }
  }

  isImageReady() { return false; }
  visionAvailable() { return false; }
  async generateImage() { return null; }
  async beginExclusiveImage() {}
  endExclusiveImage() {}
  warmImageSlot() {}
  registerMode() {}
  uiUrl(rel) { return '/llm-ui/ext/roleplay-mode/' + rel; }
}

module.exports = LabChat;
