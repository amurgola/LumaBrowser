class Faults {
  static INVALID_PARAMS = 'invalid_params';
  static UNKNOWN_ENDPOINT = 'unknown_endpoint';
  static BROWSER_UNAVAILABLE = 'browser_unavailable';
  static SITE_UNAVAILABLE = 'site_unavailable';
  static NEEDS_LOGIN = 'needs_login';
  static INTERSTITIAL = 'interstitial';
  static STEP_FAILED = 'step_failed';
  static TIMEOUT = 'timeout';
  static SHAPE_MISMATCH = 'shape_mismatch';
  static ABORTED = 'aborted';

  static CODES = Object.freeze([
    Faults.INVALID_PARAMS, Faults.UNKNOWN_ENDPOINT, Faults.BROWSER_UNAVAILABLE, Faults.SITE_UNAVAILABLE,
    Faults.NEEDS_LOGIN, Faults.INTERSTITIAL, Faults.STEP_FAILED, Faults.TIMEOUT, Faults.SHAPE_MISMATCH, Faults.ABORTED,
  ]);

  static RETRYABLE = new Set([Faults.SITE_UNAVAILABLE, Faults.INTERSTITIAL, Faults.STEP_FAILED, Faults.TIMEOUT]);

  static make(code, message, { step = null, detail = null } = {}) {
    const known = Faults.CODES.includes(code) ? code : Faults.STEP_FAILED;
    const fault = { code: known, message: String(message || known), retryable: Faults.RETRYABLE.has(known) };
    if (step != null) fault.step = step;
    if (detail != null) fault.detail = detail;
    return fault;
  }

  static advice(fault) {
    if (!fault) return '';
    switch (fault.code) {
      case Faults.NEEDS_LOGIN: return 'The site has signed out. Open the persisted tab, sign in, then call the endpoint again.';
      case Faults.INVALID_PARAMS: return 'Check the parameters against the endpoint definition.';
      case Faults.SHAPE_MISMATCH: return 'The page answered but not in the recorded shape; the endpoint may need re-recording.';
      case Faults.STEP_FAILED: return 'A step could not find its element even with recovery; the site may have changed.';
      case Faults.BROWSER_UNAVAILABLE: return 'The browser is not running in this process.';
      default: return '';
    }
  }
}

module.exports = Faults;
