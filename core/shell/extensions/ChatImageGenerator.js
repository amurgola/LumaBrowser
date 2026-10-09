const ExtensionGlobals = require('./ExtensionGlobals');
const ImageGenerationRun = require('./ImageGenerationRun');
const LabHarness = require('../../roleplay-lab/LabHarness');

class ChatImageGenerator {
  constructor({ router = ExtensionGlobals.imageRouter, lab = LabHarness.current } = {}) {
    this._router = router;
    this._lab = lab;
  }

  generate(opts = {}) {
    return new Promise((resolve) => {
      new ImageGenerationRun({ router: this._router(), lab: this._activeLab(), opts, resolve }).start();
    });
  }

  abort() {
    try {
      const router = this._router();
      if (router && typeof router.abort === 'function') router.abort();
    } catch (_) {}
  }

  _activeLab() {
    const lab = this._lab();
    return lab && lab.active ? lab : null;
  }
}

module.exports = ChatImageGenerator;
