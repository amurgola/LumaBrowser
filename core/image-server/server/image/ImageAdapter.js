class ImageAdapter {
  constructor({ baseUrl, apiKey } = {}) {
    if (!baseUrl) throw new Error('ImageAdapter: baseUrl is required');
    this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    this.apiKey = typeof apiKey === 'string' && apiKey.length > 0 ? apiKey : null;
  }

  static get protocolId() {
    throw new Error('ImageAdapter subclass must declare static protocolId');
  }

  async healthCheck() {
    throw new Error('ImageAdapter subclass must implement healthCheck()');
  }

  generate() {
    throw new Error('ImageAdapter subclass must implement generate()');
  }

  _requirePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') throw new Error('generate: prompt is required');
  }

  _authHeaders() {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }
}

module.exports = ImageAdapter;
