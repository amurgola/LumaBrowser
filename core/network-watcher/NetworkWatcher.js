class NetworkWatcher {
  static ALLOWED_WEBHOOK_PROTOCOLS = ['http:', 'https:'];

  constructor(config) {
    this.id = config.id || NetworkWatcher._generateId();
    this.urlPattern = config.urlPattern;
    this.sendTo = config.sendTo || null;
    this.note = config.note || '';
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.method = config.method || '*';
    this.captureHeaders = config.captureHeaders !== undefined ? config.captureHeaders : false;
    this.captureBody = config.captureBody !== undefined ? config.captureBody : false;
    this.createdAt = config.createdAt || new Date().toISOString();
    this.lastTriggered = config.lastTriggered || null;
    this.triggerCount = config.triggerCount || 0;
    this.lastCapturedResponse = config.lastCapturedResponse || null;
    this.validate();
  }

  static fromJSON(data) {
    return new NetworkWatcher(data);
  }

  validate() {
    this._validateUrlPattern();
    if (this.sendTo) this._validateSendTo();
  }

  matches(url, method = 'GET') {
    if (!this.enabled) return false;
    if (!this._methodMatches(method)) return false;
    return NetworkWatcher._wildcardToRegex(this.urlPattern).test(url);
  }

  recordTrigger() {
    this.lastTriggered = new Date().toISOString();
    this.triggerCount++;
  }

  toJSON() {
    return {
      id: this.id,
      urlPattern: this.urlPattern,
      sendTo: this.sendTo,
      note: this.note,
      enabled: this.enabled,
      method: this.method,
      captureHeaders: this.captureHeaders,
      captureBody: this.captureBody,
      createdAt: this.createdAt,
      lastTriggered: this.lastTriggered,
      triggerCount: this.triggerCount,
      lastCapturedResponse: this.lastCapturedResponse,
    };
  }

  _validateUrlPattern() {
    if (!this.urlPattern || typeof this.urlPattern !== 'string') {
      throw new Error('NetworkWatcher: urlPattern is required and must be a string');
    }
  }

  _validateSendTo() {
    if (typeof this.sendTo !== 'string') throw new Error('NetworkWatcher: sendTo must be a string');
    const parsed = NetworkWatcher._parseUrl(this.sendTo);
    if (!NetworkWatcher.ALLOWED_WEBHOOK_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error(`NetworkWatcher: sendTo must be an http or https URL, got "${parsed.protocol}"`);
    }
  }

  _methodMatches(method) {
    return this.method === '*' || this.method.toUpperCase() === method.toUpperCase();
  }

  static _parseUrl(value) {
    try {
      return new URL(value);
    } catch (error) {
      throw new Error(`NetworkWatcher: sendTo must be a valid URL: ${error.message}`);
    }
  }

  static _wildcardToRegex(pattern) {
    const source = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${source}$`, 'i');
  }

  static _generateId() {
    return `watcher_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

module.exports = NetworkWatcher;
