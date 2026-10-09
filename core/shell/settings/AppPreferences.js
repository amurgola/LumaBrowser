const DnsResolver = require('../DnsResolver');

class AppPreferences {
  static AUTO_CHECK_UPDATES_KEY = 'core.app.autoCheckUpdates';
  static SHOW_BOOKMARKS_BAR_KEY = 'core.ui.showBookmarksBar';
  static DNS_PROVIDER_KEY = 'core.network.dnsProvider';
  static DEFAULT_DNS_PROVIDER = 'default';

  constructor(db, { dnsResolver = DnsResolver } = {}) {
    this._db = db;
    this._dns = dnsResolver;
  }

  getAutoCheckUpdates() {
    return this._db.get(AppPreferences.AUTO_CHECK_UPDATES_KEY, true);
  }

  setAutoCheckUpdates(enabled) {
    this._db.set(AppPreferences.AUTO_CHECK_UPDATES_KEY, !!enabled);
    return { success: true };
  }

  getShowBookmarksBar() {
    return this._db.get(AppPreferences.SHOW_BOOKMARKS_BAR_KEY, null);
  }

  setShowBookmarksBar(show) {
    this._db.set(AppPreferences.SHOW_BOOKMARKS_BAR_KEY, !!show);
    return { success: true };
  }

  getDnsProvider() {
    return this._db.get(AppPreferences.DNS_PROVIDER_KEY, AppPreferences.DEFAULT_DNS_PROVIDER);
  }

  setDnsProvider(provider) {
    if (!this._dns.isValidProvider(provider)) return { success: false, error: `Unknown DNS provider: ${provider}` };
    const result = this._dns.applyProvider(provider);
    if (result.success) this._db.set(AppPreferences.DNS_PROVIDER_KEY, provider);
    return result;
  }
}

module.exports = AppPreferences;
