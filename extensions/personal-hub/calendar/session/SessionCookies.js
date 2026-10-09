class SessionCookies {
  static DEFAULT_PARTITION = 'persist:main';

  static reader(electronModule = null) {
    return async ({ partition, domain }) => {
      const electron = electronModule || SessionCookies._electron();
      if (!electron || !electron.session) return [];
      try {
        const sess = electron.session.fromPartition(partition || SessionCookies.DEFAULT_PARTITION);
        const cookies = await sess.cookies.get({ domain });
        return (cookies || []).map((c) => ({ name: c.name, value: c.value, domain: c.domain }));
      } catch (_) {
        return [];
      }
    };
  }

  static _electron() {
    try { return require('electron'); } catch (_) { return null; }
  }
}

module.exports = SessionCookies;
