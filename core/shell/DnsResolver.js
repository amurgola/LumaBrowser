const { app, session } = require('electron');

class DnsResolver {
  static PROVIDERS = {
    default: null,
    google: ['https://dns.google/dns-query'],
    cloudflare: ['https://cloudflare-dns.com/dns-query'],
  };

  static isValidProvider(provider) {
    return Object.prototype.hasOwnProperty.call(DnsResolver.PROVIDERS, provider);
  }

  static applyProvider(provider) {
    if (!DnsResolver.isValidProvider(provider)) {
      return { success: false, error: `Unknown DNS provider: ${provider}` };
    }
    try {
      const servers = DnsResolver.PROVIDERS[provider];
      app.configureHostResolver(DnsResolver._resolverConfig(servers));
      DnsResolver._clearStaleCache();
      DnsResolver._logApplied(provider, servers);
      return { success: true };
    } catch (error) {
      console.error('[dns] configureHostResolver failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  static _resolverConfig(servers) {
    if (servers) return { secureDnsMode: 'secure', secureDnsServers: servers };
    return { secureDnsMode: 'automatic', secureDnsServers: [] };
  }

  static _clearStaleCache() {
    session.defaultSession.clearHostResolverCache().catch(() => {});
  }

  static _logApplied(provider, servers) {
    const target = servers ? ` (${servers[0]})` : ' (system resolver)';
    console.log(`[dns] provider applied: ${provider}${target}`);
  }
}

module.exports = DnsResolver;
