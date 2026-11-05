class CivitaiAuth {
  static ENV_VARS = ['CIVITAI_TOKEN', 'CIVITAI_API_KEY'];

  static HOST = /(?:^|\.)civitai\.com$/i;

  static _runtimeToken = null;

  static setToken(token) {
    const value = String(token || '').trim();
    CivitaiAuth._runtimeToken = value || null;
  }

  static token() {
    if (CivitaiAuth._runtimeToken) return CivitaiAuth._runtimeToken;
    for (const name of CivitaiAuth.ENV_VARS) {
      const value = String(process.env[name] || '').trim();
      if (value) return value;
    }
    return null;
  }

  static hasToken() {
    return !!CivitaiAuth.token();
  }

  static isCivitaiUrl(url) {
    try {
      return CivitaiAuth.HOST.test(new URL(String(url)).hostname);
    } catch (_) {
      return false;
    }
  }

  static headersFor(url) {
    const token = CivitaiAuth.token();
    if (!token || !CivitaiAuth.isCivitaiUrl(url)) return {};
    return { Authorization: `Bearer ${token}` };
  }
}

module.exports = CivitaiAuth;
