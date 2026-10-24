class AppFilter {
  static MODES = ['all', 'allowlist'];
  static SELF = ['com.lumabyte.lumabrowser*', 'lumabrowser', 'luma browser', 'electron.app.lumabrowser'];

  constructor({ mode = 'all', allow = [], deny = [], ignoreSelf = true } = {}) {
    this.mode = AppFilter.MODES.includes(mode) ? mode : 'all';
    this.allow = AppFilter.parseList(allow);
    this.deny = AppFilter.parseList(deny);
    this.ignoreSelf = ignoreSelf !== false;
  }

  static parseList(value) {
    const parts = Array.isArray(value) ? value : String(value == null ? '' : value).split(/[\r\n,]+/);
    return [...new Set(parts.map((p) => String(p == null ? '' : p).trim().toLowerCase()).filter(Boolean))];
  }

  static matches(pattern, value) {
    const v = String(value || '').toLowerCase();
    if (!v || !pattern) return false;
    if (!pattern.includes('*')) return v === pattern;
    const re = new RegExp(`^${pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
    return re.test(v);
  }

  static anyMatch(patterns, values) {
    return patterns.some((p) => values.some((v) => AppFilter.matches(p, v)));
  }

  decide(item, hubApp = '') {
    const values = [item.app, item.appId, hubApp].filter(Boolean);
    if (this.ignoreSelf && AppFilter.anyMatch(AppFilter.SELF, values)) return { allowed: false, reason: 'self' };
    if (AppFilter.anyMatch(this.deny, values)) return { allowed: false, reason: 'denied' };
    if (this.mode === 'allowlist' && !AppFilter.anyMatch(this.allow, values)) return { allowed: false, reason: 'not-allowed' };
    return { allowed: true, reason: '' };
  }
}

module.exports = AppFilter;
