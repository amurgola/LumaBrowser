import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class VaultSecurityPanel {
  static AUDIT_ROWS = 20;

  constructor({ feedback }) {
    this._feedback = feedback;
    this._state = { set: false, unlocked: true, idleMinutes: 15 };
    this._pending = null;
    this._listeners = [];
  }

  install() {
    this._api = window.vaultAPI;
    const $ = (id) => document.getElementById(id);
    this._el = {
      state: $('gsLockState'), set: $('gsLockSet'), now: $('gsLockNow'), remove: $('gsLockRemove'), form: $('gsLockForm'),
      current: $('gsLockCurrent'), currentRow: $('gsLockCurrentRow'), next: $('gsLockNext'), confirm: $('gsLockConfirm'),
      cancel: $('gsLockCancel'), error: $('gsLockError'), idle: $('gsLockIdle'), external: $('gsVaultExternal'),
      audit: $('gsVaultAudit'), auditEmpty: $('gsVaultAuditEmpty'), auditClear: $('gsVaultAuditClear'),
      unlock: $('gsVaultUnlock'), unlockPass: $('gsVaultUnlockPass'), unlockError: $('gsVaultUnlockError'), unlockCancel: $('gsVaultUnlockCancel'),
    };
    if (!this._api || !this._el.state) return false;
    const e = this._el;
    e.set.addEventListener('click', () => this._openForm(this._state.set ? 'change' : 'set'));
    e.remove.addEventListener('click', () => this._openForm('remove'));
    e.now.addEventListener('click', async () => { await this._api.lock(); await this.refresh(); });
    e.cancel.addEventListener('click', () => { e.form.hidden = true; });
    e.form.addEventListener('submit', (ev) => { ev.preventDefault(); this._submitForm(); });
    e.idle.addEventListener('change', () => this._api.setAutoLock(Number(e.idle.value)));
    e.external.addEventListener('change', () => this._api.setAllowExternal(e.external.checked));
    if (e.auditClear) e.auditClear.addEventListener('click', async () => { await this._api.auditClear(); await this.refresh(); });
    e.unlock.addEventListener('submit', (ev) => { ev.preventDefault(); this._submitUnlock(); });
    e.unlockCancel.addEventListener('click', () => this._finishUnlock(false));
    document.addEventListener('settings:open', () => this.refresh());
    document.addEventListener('settings:close', () => this._finishUnlock(false));
    const tab = document.querySelector('.settings-tab[data-tab="passwords"]');
    if (tab) tab.addEventListener('click', () => this.refresh());
    return true;
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  get state() {
    return this._state;
  }

  async refresh() {
    let status = {};
    try { status = (await this._api.status()) || {}; } catch (_) { status = {}; }
    this._state = status.lock || { set: false, unlocked: true, idleMinutes: 15 };
    this._el.external.checked = !!status.allowExternal;
    try { this._audit = (await this._api.auditList()) || []; } catch (_) { this._audit = []; }
    this.render();
    for (const fn of this._listeners) fn(this._state);
  }

  static stateText(s) {
    if (!s.set) return 'Not set. Anything you allow the assistant to use works without an extra check.';
    return s.unlocked ? `Set and unlocked. Locks after ${s.idleMinutes} minutes without use.` : 'Set and locked.';
  }

  render() {
    const s = this._state;
    const e = this._el;
    e.state.textContent = VaultSecurityPanel.stateText(s);
    e.set.textContent = s.set ? 'Change' : 'Set';
    e.now.hidden = !s.set || !s.unlocked;
    e.remove.hidden = !s.set;
    e.idle.value = String(s.idleMinutes || 15);
    e.idle.disabled = !s.set;
    if (e.audit) {
      const rows = (this._audit || []).slice(0, VaultSecurityPanel.AUDIT_ROWS);
      e.audit.innerHTML = rows.map((r) => VaultSecurityPanel.auditRowHtml(r)).join('');
      e.auditEmpty.style.display = rows.length ? 'none' : '';
      e.auditClear.disabled = !rows.length;
    }
  }

  static auditRowHtml(r) {
    const esc = HtmlEscaper.escape;
    const when = new Date(r.at).toLocaleString();
    const what = `${r.item ? r.item.name : 'an item'}${r.site ? ` on ${r.site}` : ''}`;
    return `<div class="gs-ide-row"><span class="gs-ide-cell gs-vault-site">${esc(when)}</span>`
      + `<span class="gs-ide-cell gs-ide-cell--grow">${esc(what)} <span class="gs-row-help">(${esc(r.caller)})</span></span>`
      + `<span class="gs-ide-state${r.ok ? ' on' : ''}" title="${esc(r.reason)}">${r.ok ? 'Filled' : 'Refused'}</span></div>`;
  }

  async request() {
    await this.refresh();
    if (!this._state.set || this._state.unlocked) return true;
    if (this._pending) return this._pending.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    this._pending = { promise, resolve };
    this._el.unlockPass.value = '';
    this._el.unlockError.textContent = '';
    this._el.unlock.hidden = false;
    this._el.unlockPass.focus();
    return promise;
  }

  async _submitUnlock() {
    const res = await this._api.unlock(this._el.unlockPass.value);
    this._el.unlockPass.value = '';
    if (!res || !res.success) { this._el.unlockError.textContent = (res && res.error) || 'Could not unlock'; return; }
    this._finishUnlock(true);
    await this.refresh();
  }

  _finishUnlock(ok) {
    if (this._el && this._el.unlock) this._el.unlock.hidden = true;
    const pending = this._pending;
    this._pending = null;
    if (pending) pending.resolve(ok);
  }

  _openForm(mode) {
    const e = this._el;
    this._mode = mode;
    for (const input of [e.current, e.next, e.confirm]) input.value = '';
    e.currentRow.hidden = mode === 'set';
    e.next.closest('label').hidden = mode === 'remove';
    e.confirm.closest('label').hidden = mode === 'remove';
    e.error.textContent = '';
    e.form.hidden = false;
    (mode === 'set' ? e.next : e.current).focus();
  }

  async _submitForm() {
    const e = this._el;
    let res;
    if (this._mode === 'remove') {
      res = await this._api.removeMasterPassword(e.current.value);
    } else {
      if (e.next.value !== e.confirm.value) { e.error.textContent = 'The two new passwords differ'; return; }
      res = await this._api.setMasterPassword(e.current.value, e.next.value);
    }
    if (!res || !res.success) { e.error.textContent = (res && res.error) || 'Could not save'; return; }
    for (const input of [e.current, e.next, e.confirm]) input.value = '';
    e.form.hidden = true;
    this._feedback.toast(this._mode === 'remove' ? 'Master password removed' : 'Master password saved', 'ok');
    await this.refresh();
  }
}
