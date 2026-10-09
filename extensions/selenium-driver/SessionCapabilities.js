class SessionCapabilities {
  static DEFAULT_TIMEOUTS = { script: 30000, pageLoad: 300000, implicit: 0 };

  static merge(capabilities) {
    const caps = capabilities || {};
    const always = caps.alwaysMatch || {};
    const arms = Array.isArray(caps.firstMatch) && caps.firstMatch.length ? caps.firstMatch : [{}];
    const arm = arms.find((candidate) => !SessionCapabilities._overlaps(candidate, always));
    return arm ? { ...always, ...arm } : { ...always };
  }

  static returned(merged, llmFallback) {
    return {
      browserName: 'chrome',
      browserVersion: '1.0.0-lumabrowser',
      platformName: SessionCapabilities.platformName(),
      acceptInsecureCerts: !!merged.acceptInsecureCerts,
      pageLoadStrategy: merged.pageLoadStrategy || 'normal',
      setWindowRect: false,
      strictFileInteractability: false,
      timeouts: { ...SessionCapabilities.DEFAULT_TIMEOUTS },
      unhandledPromptBehavior: merged.unhandledPromptBehavior || 'dismiss and notify',
      'goog:chromeOptions': merged['goog:chromeOptions'] || {},
      'lumabyte:llmFallback': llmFallback,
      'lumabyte:features': { cdpPassthrough: true, aiDescriptionLocator: true, domSnapshot: true },
    };
  }

  static platformName(platform = process.platform) {
    if (platform === 'win32') return 'windows';
    return platform === 'darwin' ? 'mac' : 'linux';
  }

  static _overlaps(arm, always) {
    return Object.keys(arm).some((key) => Object.prototype.hasOwnProperty.call(always, key));
  }
}

module.exports = SessionCapabilities;
