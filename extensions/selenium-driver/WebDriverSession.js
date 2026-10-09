const crypto = require('crypto');

class WebDriverSession {
  static ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';

  static SHADOW_KEY = 'shadow-6066-11e4-a52e-4f735466cecf';

  constructor({ id, tabId, capabilities, llmFallback }) {
    this.id = id;
    this.tabId = tabId;
    this.capabilities = capabilities;
    this.llmFallback = llmFallback || { enabled: false };
    this.timeouts = { script: 30000, pageLoad: 300000, implicit: 0 };
    this.currentFrameChain = [];
    this.elements = new Map();
    this.shadowRoots = new Map();
    this.createdAt = Date.now();
  }

  registerElement(entry) {
    const uuid = crypto.randomUUID();
    this.elements.set(uuid, entry);
    return { [WebDriverSession.ELEMENT_KEY]: uuid };
  }

  registerShadow(entry) {
    const uuid = crypto.randomUUID();
    this.shadowRoots.set(uuid, entry);
    return { [WebDriverSession.SHADOW_KEY]: uuid };
  }

  getElement(uuid) {
    return this.elements.get(uuid) || null;
  }

  getShadow(uuid) {
    return this.shadowRoots.get(uuid) || null;
  }
}

module.exports = WebDriverSession;
