export default class DefaultsPrefs {
  static AUTO_UNLOAD_MS = 15 * 60 * 1000;

  constructor() {
    this.autoUnloadMs = 0;
    this.unloadOnVramPressure = null;
    this.approvalPolicy = null;
    this.ramPinStatus = null;
  }

  async load(api) {
    this.autoUnloadMs = await DefaultsPrefs._read(api, 'getAutoUnloadMs', (r) => (r && r.success ? r.ms || 0 : 0), 0);
    this.unloadOnVramPressure = await DefaultsPrefs._read(api, 'getUnloadOnVramPressure', (r) => (r && r.success ? !!r.enabled : null), null);
    this.approvalPolicy = await DefaultsPrefs._read(api, 'getApprovalPolicy', DefaultsPrefs.policyFrom, null);
    const pin = await DefaultsPrefs._read(api, 'getRamPinStatus', (r) => (r && r.success ? r.status : undefined), undefined);
    if (pin !== undefined) this.ramPinStatus = pin;
  }

  ramPinSupported() {
    return !!(this.ramPinStatus && this.ramPinStatus.supported);
  }

  static policyFrom(r) {
    const v = r && typeof r === 'object' ? r.policy : r;
    return (v === 'ask' || v === 'never') ? v : 'auto';
  }

  static async _read(api, method, pick, fallback) {
    if (typeof api[method] !== 'function') return fallback;
    try { return pick(await api[method]()); } catch (_) { return fallback; }
  }
}
