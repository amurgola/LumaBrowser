class PageBlockDetector {
  static CHALLENGE_TITLE = /just a moment|attention required|access denied|verify you are human|checking your browser|security check|are you a robot|bot verification|please verify|verifying you are|one more step/i;
  static CHALLENGE_URL = /\/cdn-cgi\/challenge|__cf_chl|\/challenge-platform\/|\bcaptcha\b|\/sorry\//i;
  static CAPTCHA_LABEL = /captcha|not a robot|i am human|i'm human|verify you are human/i;
  static SECOND_FACTOR = /two[- ]factor|2fa|verification code|security code|one-time (code|password)|enter the code|verify your identity|authenticator/i;
  static SIGN_IN_TITLE = /\b(sign in|log in|login|log on|sign on)\b/i;

  static KINDS = Object.freeze({
    challenge: 'a bot check (a browser challenge page)',
    captcha: 'a CAPTCHA',
    login: 'a sign-in form',
    second_factor: 'a second-factor (verification code) prompt',
  });

  static detect(result) {
    const r = result || {};
    const title = String(r.title || '');
    const url = String(r.url || '');
    const rows = [...(r.viewport || []), ...(r.below || [])];
    const kind = PageBlockDetector._kind(title, url, rows);
    if (!kind) return null;
    return { kind, label: PageBlockDetector.KINDS[kind], note: PageBlockDetector.note(kind) };
  }

  static note(kind) {
    const label = PageBlockDetector.KINDS[kind] || 'something only the user can do';
    return `BLOCKED: this page shows ${label}. Only the user can get past it: do not click or type at it. `
      + 'Call ask_user_takeover with one sentence saying what to do in the tab, then observe the page again.';
  }

  static _kind(title, url, rows) {
    if (PageBlockDetector.CHALLENGE_URL.test(url) || PageBlockDetector.CHALLENGE_TITLE.test(title)) return 'challenge';
    if (rows.some((e) => PageBlockDetector.CAPTCHA_LABEL.test(String(e.label || '')))) return 'captcha';
    const text = `${title} ${rows.map((e) => e.label || '').join(' ')}`;
    if (PageBlockDetector.SECOND_FACTOR.test(text)) return 'second_factor';
    if (rows.some((e) => String(e.role || '') === 'input:password')) return 'login';
    return null;
  }
}

module.exports = PageBlockDetector;
