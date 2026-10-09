class SignInPages {
  static PAGES = [
    ['accounts.google.com', null],
    ['login.microsoftonline.com', null],
    ['login.live.com', null],
    ['login.microsoft.com', null],
    ['slack.com', /^\/(signin|workspace-signin|check-login|get-started)/i],
    ['app.clickup.com', /^\/(login|signup)/i],
    ['messages.google.com', /^\/web\/authentication/i],
    ['account.proton.me', /^\/(login|mail|calendar)?\/?$/i],
    ['discord.com', /^\/login/i],
  ];

  static isSignIn(url) {
    let parsed;
    try { parsed = new URL(String(url || '')); } catch (_) { return false; }
    const host = parsed.hostname.toLowerCase();
    return SignInPages.PAGES.some(([suffix, path]) => (host === suffix || host.endsWith(`.${suffix}`)) && (!path || path.test(parsed.pathname)));
  }
}

module.exports = SignInPages;
