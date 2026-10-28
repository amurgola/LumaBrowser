const CardText = require('./CardText');

class DesktopCallRisk {
  static SENSITIVE_PLACE = /\b(checkout|payment|payments|billing|pay now|place order|place your order|purchase|credit card|debit card|card number|bank|banking|wallet|wire transfer|send money)\b/i;
  static TYPING = new Set(['desktop_type', 'desktop_set_value']);
  static INPUT = new Set(['desktop_click', 'desktop_type', 'desktop_press_key', 'desktop_scroll', 'desktop_drag', 'desktop_set_value']);

  static assess(name, params, desktop) {
    const p = params || {};
    if (!desktop || typeof name !== 'string' || !name.startsWith('desktop_')) return null;
    if (DesktopCallRisk.TYPING.has(name) && DesktopCallRisk._passwordField(p, desktop)) return { reason: 'a password field' };
    if (name === 'desktop_launch') {
      const target = `${p.app == null ? '' : p.app} ${p.args == null ? '' : p.args}`;
      return DesktopCallRisk.SENSITIVE_PLACE.test(target) ? { reason: 'a payment or banking page' } : null;
    }
    if (!DesktopCallRisk.INPUT.has(name)) return null;
    const title = DesktopCallRisk._titleOf(p, desktop);
    return title && DesktopCallRisk.SENSITIVE_PLACE.test(title) ? { reason: `a payment or banking window, "${CardText.clip(title, 40)}"` } : null;
  }

  static assessor(getDesktop) {
    return (name, params) => {
      let desktop = null;
      try { desktop = typeof getDesktop === 'function' ? getDesktop() : getDesktop; } catch (_) { desktop = null; }
      try { return DesktopCallRisk.assess(name, params, desktop); } catch (_) { return null; }
    };
  }

  static _passwordField(p, desktop) {
    if (p.ref == null || p.hwnd == null || typeof desktop.observedNode !== 'function') return false;
    const node = desktop.observedNode(Number(p.hwnd), Number(p.ref));
    return !!(node && node.password);
  }

  static _titleOf(p, desktop) {
    if (p.window) return String(p.window);
    if (p.hwnd == null || Number(p.hwnd) === 0 || typeof desktop.resolve !== 'function') return null;
    const found = desktop.resolve({ hwnd: Number(p.hwnd) });
    return found && found.w ? String(found.w.title || '') : null;
  }
}

module.exports = DesktopCallRisk;
