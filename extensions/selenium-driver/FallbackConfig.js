class FallbackConfig {
  static normalize(capValue, defaults) {
    const d = defaults || {};
    if (capValue === true) return FallbackConfig._allOn(d);
    if (capValue === false || capValue == null) return FallbackConfig._fromDefaults(d);
    if (typeof capValue === 'object') return FallbackConfig._fromObject(capValue, d);
    return { enabled: false, onFindFail: false, onClickIntercepted: false, slot: null };
  }

  static _allOn(d) {
    return { enabled: true, onFindFail: true, onClickIntercepted: true, slot: d.slot || null };
  }

  static _fromDefaults(d) {
    return {
      enabled: !!d.defaultEnabled,
      onFindFail: d.defaultEnabled && d.onFindFail !== false,
      onClickIntercepted: d.defaultEnabled && d.onClickIntercepted !== false,
      slot: d.slot || null,
    };
  }

  static _fromObject(cap, d) {
    return {
      enabled: cap.enabled !== false,
      onFindFail: cap.onFindFail !== false,
      onClickIntercepted: cap.onClickIntercepted !== false,
      slot: cap.slot || d.slot || null,
    };
  }
}

module.exports = FallbackConfig;
