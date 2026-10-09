export default class UrlSecurityBadge {
  static TITLES = {
    secure: 'Connection is secure (HTTPS)',
    insecure: 'Not secure: this page is loaded over plain HTTP',
  };

  static stateFor(url) {
    if (/^https:\/\//i.test(url || '')) return 'secure';
    if (/^http:\/\//i.test(url || '')) return 'insecure';
    return '';
  }

  static update(url) {
    const el = document.getElementById('urlBarSecurity');
    if (!el) return;
    const state = UrlSecurityBadge.stateFor(url);
    if (el.dataset.state === state) return;
    const title = state ? UrlSecurityBadge.TITLES[state] : '';
    el.dataset.state = state;
    el.title = title;
    el.setAttribute('aria-label', title);
    el.hidden = !state;
    const use = el.querySelector('use');
    if (use) use.setAttribute('href', state === 'secure' ? '#i-lock' : '#i-alert');
  }
}
