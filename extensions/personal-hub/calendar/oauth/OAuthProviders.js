class OAuthProviders {
  static GOOGLE = Object.freeze({
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  });

  static MICROSOFT_DEFAULT_TENANT = 'common';

  static microsoft(tenant) {
    const t = encodeURIComponent(String(tenant || '').trim() || OAuthProviders.MICROSOFT_DEFAULT_TENANT);
    return {
      authUrl: `https://login.microsoftonline.com/${t}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${t}/oauth2/v2.0/token`,
      scopes: ['offline_access', 'Calendars.Read', 'User.Read'],
      extraAuthParams: {},
    };
  }

  static for(kind, config = {}) {
    if (kind === 'google') return OAuthProviders.GOOGLE;
    if (kind === 'microsoft') return OAuthProviders.microsoft(config && config.tenant);
    return null;
  }
}

module.exports = OAuthProviders;
