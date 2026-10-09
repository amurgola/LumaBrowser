const SignedLumaClient = require('../shared/lumabyte/SignedLumaClient');
const PulseDeviceInfo = require('./PulseDeviceInfo');

class PulseService {
  static DEFAULT_BASE_URL = 'https://lumabyte.com';
  static DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
  static INITIAL_DELAY_MS = 15 * 1000;
  static REQUEST_TIMEOUT_MS = 4000;
  static TIER = 'community';

  constructor({ identity, consent, baseUrl = PulseService.DEFAULT_BASE_URL, intervalMs = PulseService.DEFAULT_INTERVAL_MS, client } = {}) {
    this._identity = identity;
    this._consent = consent;
    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._intervalMs = intervalMs;
    this._client = client || this._createClient();
    this._initialTimer = null;
    this._timer = null;
    this._started = false;
  }

  start() {
    if (!this._telemetryAllowed()) {
      console.log('PulseService: telemetry disabled (developer mode or user opt-out), no check-in to lumabyte.com');
      return;
    }
    if (this._started) return;
    this._started = true;
    this._initialTimer = setTimeout(() => this._tick(), PulseService.INITIAL_DELAY_MS);
    this._timer = setInterval(() => this._tick(), this._intervalMs);
  }

  stop() {
    clearTimeout(this._initialTimer);
    clearInterval(this._timer);
    this._initialTimer = null;
    this._timer = null;
    this._started = false;
  }

  getStatus() {
    return { tier: PulseService.TIER, enabled: this._telemetryAllowed(), running: this._started };
  }

  pulseNow() {
    return this._tick();
  }

  async _tick() {
    if (!this._telemetryAllowed()) return false;
    if (!this._identity || !this._identity.machineId) return false;
    return this._postPulse();
  }

  async _postPulse() {
    const response = await this._client.request({
      method: 'POST',
      url: `${this._baseUrl}/api/pulse`,
      body: PulseService._payload(),
      headers: { 'Content-Type': 'application/json', 'User-Agent': PulseDeviceInfo.userAgent() },
      timeoutMs: PulseService.REQUEST_TIMEOUT_MS,
    });
    return !!response && response.statusCode >= 200 && response.statusCode < 300;
  }

  static _payload() {
    return JSON.stringify({
      tier: PulseService.TIER,
      version: PulseDeviceInfo.appVersion(),
      platform: PulseDeviceInfo.platform(),
    });
  }

  _telemetryAllowed() {
    return !!(this._consent && this._consent.allowed);
  }

  _createClient() {
    return new SignedLumaClient({
      baseUrl: this._baseUrl,
      identity: this._identity,
      label: 'PulseService',
      allowEgress: () => this._telemetryAllowed(),
    });
  }
}

module.exports = PulseService;
