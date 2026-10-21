const ChromeBrandList = require('./identity/ChromeBrandList');
const WindowsPlatformVersion = require('./identity/WindowsPlatformVersion');

class ChromeIdentity {
  static CHROME_VERSION = '154';
  static CHROME_FULL_VERSION = '154.0.8037.57';
  static CHROME_REDUCED_VERSION = `${ChromeIdentity.CHROME_VERSION}.0.0.0`;
  static SEED = parseInt(ChromeIdentity.CHROME_VERSION, 10);

  static BRANDS = ChromeBrandList.build(ChromeIdentity.SEED, ChromeIdentity.CHROME_VERSION, '');
  static FULL_VERSION_BRANDS = ChromeBrandList.build(ChromeIdentity.SEED, ChromeIdentity.CHROME_FULL_VERSION, '.0.0.0');

  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    `(KHTML, like Gecko) Chrome/${ChromeIdentity.CHROME_REDUCED_VERSION} Safari/537.36`;

  static ARCHITECTURE = process.arch === 'arm64' ? 'arm' : 'x86';
  static BITNESS = process.arch === 'ia32' ? '32' : '64';

  static LOW_ENTROPY_HEADERS = {
    'Sec-CH-UA': ChromeBrandList.toHeader(ChromeIdentity.BRANDS),
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
  };

  static _platformVersion = null;
  static _highEntropyOverrides = null;
  static _uaMetadata = null;

  static get PLATFORM_VERSION() {
    if (ChromeIdentity._platformVersion === null) ChromeIdentity._platformVersion = WindowsPlatformVersion.detect();
    return ChromeIdentity._platformVersion;
  }

  static get HIGH_ENTROPY_OVERRIDES() {
    if (!ChromeIdentity._highEntropyOverrides) {
      ChromeIdentity._highEntropyOverrides = {
        'sec-ch-ua-full-version-list': ChromeBrandList.toHeader(ChromeIdentity.FULL_VERSION_BRANDS),
        'sec-ch-ua-full-version': `"${ChromeIdentity.CHROME_FULL_VERSION}"`,
        'sec-ch-ua-platform-version': `"${ChromeIdentity.PLATFORM_VERSION}"`,
        'sec-ch-ua-arch': `"${ChromeIdentity.ARCHITECTURE}"`,
        'sec-ch-ua-bitness': `"${ChromeIdentity.BITNESS}"`,
        'sec-ch-ua-model': '""',
      };
    }
    return ChromeIdentity._highEntropyOverrides;
  }

  static get UA_METADATA() {
    if (!ChromeIdentity._uaMetadata) {
      ChromeIdentity._uaMetadata = {
        brands: ChromeIdentity.BRANDS,
        fullVersionList: ChromeIdentity.FULL_VERSION_BRANDS,
        fullVersion: ChromeIdentity.CHROME_FULL_VERSION,
        platform: 'Windows',
        platformVersion: ChromeIdentity.PLATFORM_VERSION,
        architecture: ChromeIdentity.ARCHITECTURE,
        model: '',
        mobile: false,
        bitness: ChromeIdentity.BITNESS,
        wow64: false,
        formFactors: ['Desktop'],
      };
    }
    return ChromeIdentity._uaMetadata;
  }

  static _appliedSessions = new WeakSet();

  static acceptLanguage() {
    const locale = ChromeIdentity._uiLocale();
    const base = locale.split('-')[0];
    return base && base !== locale ? `${locale},${base}` : locale;
  }

  static applyToSession(sess) {
    if (!sess || ChromeIdentity._appliedSessions.has(sess)) return;
    ChromeIdentity._appliedSessions.add(sess);
    try {
      sess.setUserAgent(ChromeIdentity.USER_AGENT, ChromeIdentity.acceptLanguage());
    } catch (_) {
    }
  }

  static overrideParams() {
    return {
      userAgent: ChromeIdentity.USER_AGENT,
      acceptLanguage: ChromeIdentity.acceptLanguage(),
      platform: 'Win32',
      userAgentMetadata: ChromeIdentity.UA_METADATA,
    };
  }

  static _uiLocale() {
    try {
      return require('electron').app.getLocale() || 'en-US';
    } catch (_) {
      return 'en-US';
    }
  }
}

WindowsPlatformVersion.prefetch().catch(() => {});

module.exports = ChromeIdentity;
