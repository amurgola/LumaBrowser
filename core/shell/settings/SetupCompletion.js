const OnboardingPersona = require('./OnboardingPersona');

class SetupCompletion {
  static KEY = 'core.setupComplete';
  static DISABLED_EXTENSIONS_KEY = 'shell.extensions.disabled';
  static WEBHOOK_URL_KEY = 'webhookUrl';

  constructor({ db, onSetupFinalized = null, now = () => new Date(), logError = console.error }) {
    this._db = db;
    this._onSetupFinalized = onSetupFinalized;
    this._now = now;
    this._logError = logError;
  }

  get() {
    return this._db.get(SetupCompletion.KEY, null);
  }

  async complete(payload) {
    const record = payload && typeof payload === 'object' ? payload : {};
    const wasComplete = !!this.get();
    this._db.set(SetupCompletion.KEY, { completedAt: this._now().toISOString(), ...record });
    if (OnboardingPersona.isKnown(record.persona)) this._db.set(OnboardingPersona.KEY, record.persona);
    if (!wasComplete) await this._finalizeFirstRun();
    return { success: true };
  }

  reset() {
    this._db.delete(SetupCompletion.KEY);
    return { success: true };
  }

  setDisabledExtensions(ids) {
    if (!Array.isArray(ids)) return { success: false, error: 'ids must be an array' };
    this._db.set(SetupCompletion.DISABLED_EXTENSIONS_KEY, ids);
    return { success: true };
  }

  setWebhookUrl(url) {
    if (typeof url !== 'string') return { success: false, error: 'url must be a string' };
    this._db.set(SetupCompletion.WEBHOOK_URL_KEY, url);
    return { success: true };
  }

  async _finalizeFirstRun() {
    if (typeof this._onSetupFinalized !== 'function') return;
    try {
      await this._onSetupFinalized();
    } catch (err) {
      this._logError('onSetupFinalized failed:', err);
    }
  }
}

module.exports = SetupCompletion;
