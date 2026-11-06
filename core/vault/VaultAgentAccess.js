const VaultSites = require('./VaultSites');
const AutofillFields = require('./AutofillFields');
const VaultStore = require('./VaultStore');
const VaultPlaceholders = require('./VaultPlaceholders');
const Totp = require('./Totp');

class VaultAgentAccess {
  static EXTERNAL_KEY = 'core.vault.allowExternal';
  static KEY_TOOLS = new Set(['send_webhook', 'send_notification_ntfy', 'run_command']);

  constructor({ vault, db, audit = () => {} }) {
    this._vault = vault;
    this._db = db;
    this._audit = audit;
  }

  allowExternal() {
    try { return this._db.get(VaultAgentAccess.EXTERNAL_KEY, false) === true; } catch (_) { return false; }
  }

  setAllowExternal(on) {
    this._db.set(VaultAgentAccess.EXTERNAL_KEY, !!on);
    return !!on;
  }

  static mask(username) {
    const s = String(username || '');
    if (!s) return '';
    const at = s.indexOf('@');
    const local = at > 0 ? s.slice(0, at) : s;
    const shown = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local[local.length - 1]}`;
    return at > 0 ? `${shown}${s.slice(at)}` : shown;
  }

  list({ tabUrl = null, caller = {} } = {}) {
    const gate = this._gate(caller);
    if (gate) return gate;
    const items = this._vault.store.all().filter((i) => i.aiAccess);
    const logins = items.filter((i) => i.type === 'login' && (!tabUrl || VaultSites.match(i.origin, tabUrl)))
      .map((i) => ({ ref: i.id, kind: 'login', name: i.title || VaultSites.hostOf(i.origin), site: VaultSites.hostOf(i.origin), username: VaultAgentAccess.mask(i.username) }));
    const profiles = items.filter((i) => i.type === 'profile')
      .map((i) => ({ ref: i.id, kind: 'profile', name: i.title || 'Address', fields: AutofillFields.KEYS.filter((k) => i[k]) }));
    const keys = items.filter((i) => i.type === 'key' && VaultStore.slug(i.title))
      .map((i) => ({ ref: i.id, kind: 'key', name: i.title, placeholder: `{{vault:${VaultStore.slug(i.title)}}}`, usableIn: [...VaultAgentAccess.KEY_TOOLS] }));
    for (const l of logins) {
      const item = items.find((i) => i.id === l.ref);
      if (item && Totp.parse(item.totp)) l.hasTwoFactor = true;
    }
    return { success: true, items: [...logins, ...profiles, ...keys] };
  }

  describe(ref) {
    const item = this._vault.store.get(String(ref || ''));
    if (!item) return null;
    if (item.type === 'login') return { kind: 'login', name: item.title || VaultSites.hostOf(item.origin), site: VaultSites.hostOf(item.origin) };
    if (item.type === 'key') return { kind: 'key', name: item.title, site: '' };
    return { kind: 'profile', name: item.title || 'Address', site: '' };
  }

  resolveKeys(toolName, params, caller = {}) {
    const names = VaultPlaceholders.namesIn(params);
    if (!names.length) return { params };
    if (!VaultAgentAccess.KEY_TOOLS.has(toolName)) {
      return { error: `{{vault:...}} placeholders only work in ${[...VaultAgentAccess.KEY_TOOLS].join(', ')}, not ${toolName}.` };
    }
    const gate = this._gate(caller);
    if (gate) return { error: gate.error };
    const keys = this._vault.store.all().filter((i) => i.type === 'key' && i.aiAccess);
    const values = {};
    const missing = [];
    for (const name of names) {
      const item = keys.find((k) => VaultStore.slug(k.title) === name);
      if (item) values[name] = item.value; else missing.push(name);
    }
    if (missing.length) {
      const available = keys.map((k) => `{{vault:${VaultStore.slug(k.title)}}}`).join(', ') || 'none';
      return { error: `No saved key the assistant may use is named ${missing.join(', ')}. Available: ${available}.` };
    }
    for (const name of names) {
      const item = keys.find((k) => VaultStore.slug(k.title) === name);
      this._audit({ action: 'key', item: { ref: item.id, kind: 'key', name: item.title }, site: toolName, tabId: null, caller: VaultAgentAccess._callerName(caller), ok: true, reason: '' });
    }
    this._vault.touchLock();
    return { params: VaultPlaceholders.replace(params, values) };
  }

  fill({ tabId, ref, caller = {}, part = null }) {
    const gate = this._gate(caller);
    if (gate) return this._refuse(gate, { action: 'fill', ref, tabId, caller });
    const item = this._vault.store.get(String(ref || ''));
    if (!item) return this._refuse({ success: false, error: 'No such vault item. Call vault_list first.' }, { action: 'fill', ref, tabId, caller });
    if (!item.aiAccess) {
      return this._refuse({ success: false, error: 'The user has not allowed the assistant to use this item. They can turn it on in Settings > Passwords & autofill.' }, { action: 'fill', item, tabId, caller });
    }
    if (item.type === 'key') return this._refuse({ success: false, error: `A key is not filled into pages; use {{vault:${VaultStore.slug(item.title)}}} in ${[...VaultAgentAccess.KEY_TOOLS].join(', ')}.` }, { action: 'fill', item, tabId, caller });
    let res;
    if (item.type === 'profile') res = this._vault.fillProfile(tabId, item.id);
    else if (part === 'otp') res = this._vault.fillOtp(tabId, item.id);
    else res = this._vault.fill(tabId, item.id);
    const site = item.type === 'login' ? VaultSites.hostOf(item.origin) : '';
    this._audit({ action: 'fill', item: { ref: item.id, kind: item.type, name: item.title || site || 'Address' }, site, tabId, caller: VaultAgentAccess._callerName(caller), ok: !!res.success, reason: res.error || '' });
    if (!res.success) return { success: false, error: res.error };
    this._vault.touchLock();
    const filled = item.type === 'profile' ? 'address' : (part === 'otp' ? 'two-factor code' : 'login');
    return { success: true, filled, name: item.title || site, site };
  }

  _gate(caller) {
    if (caller && caller.external && !this.allowExternal()) {
      return { success: false, error: 'Outside callers may not use the vault. The user can allow it in Settings > Passwords & autofill.' };
    }
    if (this._vault.isLocked()) {
      return { success: false, locked: true, error: 'The vault is locked. Ask the user to unlock it in Settings > Passwords & autofill.' };
    }
    if (this._vault.store.status().unreadable) return { success: false, error: 'The vault cannot be opened on this account.' };
    return null;
  }

  _refuse(result, { action, ref, item, tabId, caller }) {
    const named = item ? { ref: item.id, kind: item.type, name: item.title || VaultSites.hostOf(item.origin) } : { ref: String(ref || '') };
    this._audit({ action, item: named, site: '', tabId, caller: VaultAgentAccess._callerName(caller), ok: false, reason: result.error });
    return result;
  }

  static _callerName(caller) {
    return caller && caller.external ? (caller.name || 'outside caller') : 'chat';
  }
}

module.exports = VaultAgentAccess;
