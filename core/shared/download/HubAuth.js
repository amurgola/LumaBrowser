class HubAuth {
  static ENV_VARS = ['HF_TOKEN', 'HUGGING_FACE_HUB_TOKEN'];

  static HUB_HOST = /(?:^|\.)(?:huggingface\.co|hf\.co)$/i;

  static token() {
    for (const name of HubAuth.ENV_VARS) {
      const value = String(process.env[name] || '').trim();
      if (value) return value;
    }
    return null;
  }

  static hasToken() {
    return !!HubAuth.token();
  }

  static isHubUrl(url) {
    try {
      return HubAuth.HUB_HOST.test(new URL(String(url)).hostname);
    } catch (_) {
      return false;
    }
  }

  static headersFor(url) {
    const token = HubAuth.token();
    if (!token || !HubAuth.isHubUrl(url)) return {};
    return { Authorization: `Bearer ${token}` };
  }
}

module.exports = HubAuth;
