import SettingToggle from './SettingToggle.js';
import FoldGroups from './FoldGroups.js';

export default class IdeInstallerList {
  static JETBRAINS = {
    ns: 'idePlugin',
    prefix: 'gsIdePlugin',
    fold: 'jetbrains',
    autoInstall: true,
    copy: {
      noun: 'Plugin', one: 'IDE', many: 'IDEs', noneShort: 'No JetBrains IDE found',
      notBundled: 'The JetBrains plugin is not bundled in this build.',
      noneFound: 'No JetBrains IDE found for this user yet. Run the IDE once, then rescan.',
      restartHint: 'Restart the IDE if it is open.',
      afterInstall: 'Restart the IDE to see the Luma tool window.',
      opFailed: 'The plugin could not be copied.',
    },
  };

  static VSCODE = {
    ns: 'vscodeExtension',
    prefix: 'gsVscodeExt',
    fold: 'vscode',
    copy: {
      noun: 'Extension', one: 'editor', many: 'editors', noneShort: 'No editor found',
      notBundled: 'The VS Code extension is not bundled in this build.',
      noneFound: 'No VS Code, VS Code Insiders, VSCodium, Cursor or Windsurf installation was found on this machine.',
      restartHint: 'Reload the editor window if it is open.',
      afterInstall: 'Reload the editor window to see Luma in the activity bar.',
      opFailed: 'The extension could not be installed.',
    },
  };

  static WINDHAWK = {
    ns: 'windhawkMods',
    prefix: 'gsWindhawk',
    fold: 'windhawk',
    copy: {
      noun: 'Mod', one: 'mod', many: 'mods', noneShort: 'Windhawk not found',
      notBundled: 'The Windhawk mods are not bundled in this build.',
      noneFound: 'Windhawk was not found on this machine.',
      restartHint: 'Manage it in Windhawk.',
      afterInstall: 'Windhawk loads it right away.',
      opFailed: 'The mod could not be installed.',
      installedVerb: 'into Windhawk',
      staleText: (ide, sourceVersion) => `Installed v${ide.installedVersion || '?'}; v${ide.version || sourceVersion} is available.`,
      updateInPlace: true,
    },
  };

  constructor({ feedback, config }) {
    this._feedback = feedback;
    this._ns = config.ns;
    this._fold = config.fold || null;
    this._foldAction = null;
    this._copy = config.copy;
    this._list = document.getElementById(`${config.prefix}List`);
    this._help = document.getElementById(`${config.prefix}Help`);
    this._installAll = document.getElementById(`${config.prefix}InstallAll`);
    this._refresh = document.getElementById(`${config.prefix}Refresh`);
    this._auto = config.autoInstall ? document.getElementById(`${config.prefix}AutoInstall`) : null;
    this._defaultHelp = this._help ? this._help.textContent : '';
    this._busy = false;
    this._showOlder = false;
  }

  install() {
    if (this._installAll) this._installAll.addEventListener('click', () => this.run('install', []));
    if (this._refresh) this._refresh.addEventListener('click', () => this.load());
    SettingToggle.wire(this._auto, (v) => this._writeAutoInstall(v), this._feedback, () => this.load());
    if (this._fold) FoldGroups.onAction(this._fold, () => { if (this._foldAction) this.run(this._foldAction.op, this._foldAction.ids); });
  }

  async load() {
    if (!this._list) return;
    let s = null;
    try { s = await window.ipcBridge.invoke(`core.settings.${this._ns}.status`); } catch (_) { s = null; }
    this._list.innerHTML = '';
    this._summarize(s);
    if (!s || s.success === false || !s.available) {
      if (this._help) this._help.textContent = (s && s.error) || this._copy.notBundled;
      if (this._installAll) this._installAll.disabled = true;
      if (this._auto) { this._auto.checked = false; this._auto.disabled = true; }
      return;
    }
    if (this._help) this._help.textContent = this._defaultHelp + (s.sourceVersion ? ` ${this._copy.noun} version ${s.sourceVersion}.` : '') + (s.summary ? ` ${s.summary}` : '');
    if (this._auto) { this._auto.checked = !!s.autoInstall; this._auto.disabled = this._busy; }
    this._renderRows(s);
  }

  async run(op, ids) {
    if (this._busy) return;
    this._setBusy(true);
    try {
      const r = await window.ipcBridge.invoke(`core.settings.${this._ns}.${op}`, ids || []);
      this._report(op, r);
    } catch (e) {
      this._feedback.toast((e && e.message) || this._copy.opFailed, 'error');
    } finally {
      this._busy = false;
      this.load();
    }
  }

  static outcome(op, r, copy) {
    const failed = (r && r.failed) || [];
    const why = failed.length && failed[0].error ? ` (${failed[0].error})` : '';
    if (!r || r.success === false) return [(r && r.error) || copy.opFailed, 'error'];
    if (op === 'install') {
      const n = (r.installed || []).length;
      const message = n
        ? (copy.installedVerb
          ? `${n} ${n === 1 ? copy.one : copy.many} installed ${copy.installedVerb}. ${copy.afterInstall}${failed.length ? ` ${failed.length} failed${why}.` : ''}`
          : `${copy.noun} installed in ${n} ${n === 1 ? copy.one : copy.many}. ${copy.afterInstall}${failed.length ? ` ${failed.length} failed${why}.` : ''}`)
        : `Nothing was installed${why}.`;
      return [message, failed.length || !n ? 'error' : 'ok'];
    }
    const n = (r.removed || []).length;
    const removed = copy.installedVerb ? `${n} ${n === 1 ? copy.one : copy.many} removed.` : `${copy.noun} removed from ${n} ${n === 1 ? copy.one : copy.many}.`;
    return [n ? removed : `Nothing was removed${why}.`, failed.length ? 'error' : undefined];
  }

  static summary(s, copy) {
    if (!s || s.success === false || !s.available) return { text: 'Not available', attention: false, action: null };
    const { newest } = IdeInstallerList.split(s.ides);
    if (!newest.length) return { text: copy.noneShort || 'None found', attention: false, action: null };
    const installed = newest.filter((ide) => ide.installed);
    const stale = installed.filter((ide) => !ide.current);
    const count = (n) => `${n} ${n === 1 ? copy.one : copy.many}`;
    if (stale.length && copy.updateInPlace) {
      return { text: `Update available for ${count(stale.length)}`, attention: true, action: { label: 'Update', op: 'install', ids: stale.map((ide) => ide.id) } };
    }
    if (!installed.length) return { text: 'Not installed', attention: false, action: { label: 'Install', op: 'install', ids: [] } };
    const all = installed.length === newest.length;
    const base = copy.installedVerb
      ? (all ? `${count(installed.length)} installed` : `${installed.length} of ${count(newest.length)} installed`)
      : (all ? `Installed in ${count(installed.length)}` : `Installed in ${installed.length} of ${count(newest.length)}`);
    return { text: stale.length ? `${base}, updates on next start` : base, attention: false, action: null };
  }

  static split(ides) {
    const list = Array.isArray(ides) ? ides : [];
    return { newest: list.filter((ide) => ide.latest !== false), older: list.filter((ide) => ide.latest === false) };
  }

  static olderLabel(count, shown) {
    if (shown) return 'Hide older versions';
    return `Show ${count} older version${count === 1 ? '' : 's'}`;
  }

  _report(op, r) {
    const [message, kind] = IdeInstallerList.outcome(op, r, this._copy);
    this._feedback.toast(message, kind);
  }

  async _writeAutoInstall(enabled) {
    if (this._busy) return { success: false, error: 'Still working on the last change.' };
    this._setBusy(true);
    try {
      const r = await window.ipcBridge.invoke(`core.settings.${this._ns}.setAutoInstall`, !!enabled);
      if (enabled && r && r.success !== false) this._report('install', r);
      return r;
    } finally {
      this._busy = false;
    }
  }

  _summarize(s) {
    if (!this._fold) return;
    const sum = IdeInstallerList.summary(s, this._copy);
    this._foldAction = sum.action;
    FoldGroups.summarize(this._fold, sum.text, { attention: sum.attention });
    FoldGroups.setAction(this._fold, sum.action ? { label: this._busy ? 'Working…' : sum.action.label, disabled: this._busy } : null);
  }

  _setBusy(on) {
    this._busy = on;
    if (this._fold && this._foldAction) FoldGroups.setAction(this._fold, { label: on ? 'Working…' : this._foldAction.label, disabled: on });
    if (this._installAll) this._installAll.disabled = on;
    if (this._auto) this._auto.disabled = on;
    this._list.querySelectorAll('button.gs-action-btn').forEach((b) => { b.disabled = on; b.textContent = 'Working…'; });
  }

  _renderRows(s) {
    const { newest, older } = IdeInstallerList.split(s.ides);
    if (this._installAll) this._installAll.disabled = !(newest.length || older.length) || this._busy;
    if (!newest.length && !older.length) {
      const empty = document.createElement('div');
      empty.className = 'gs-ide-empty';
      empty.textContent = s.emptyReason || this._copy.noneFound;
      this._list.appendChild(empty);
      return;
    }
    for (const ide of newest) this._list.appendChild(this._row(ide, s.sourceVersion));
    if (!older.length) return;
    this._list.appendChild(this._olderToggle(older.length));
    if (this._showOlder) for (const ide of older) this._list.appendChild(this._row(ide, s.sourceVersion));
  }

  static stateText(ide, sourceVersion, copy) {
    if (!ide.installed) return 'Not installed';
    if (ide.current) return `Installed${ide.installedVersion ? ` (v${ide.installedVersion})` : ''}`;
    if (copy.staleText) return copy.staleText(ide, sourceVersion);
    return `Installed v${ide.installedVersion || '?'}, will update to v${sourceVersion} on next start.`;
  }

  _row(ide, sourceVersion) {
    const row = document.createElement('div');
    row.className = 'gs-ide-row' + (ide.latest === false ? ' old' : '');
    const name = document.createElement('span');
    name.className = 'gs-ide-name';
    name.textContent = ide.label;
    const state = document.createElement('span');
    state.className = 'gs-ide-state' + (ide.installed && !ide.current ? ' stale' : '');
    state.textContent = IdeInstallerList.stateText(ide, sourceVersion, this._copy);
    if (ide.installed && ide.current) state.title = this._copy.restartHint;
    if (ide.description) name.title = ide.description;
    const buttons = [];
    if (this._copy.updateInPlace && ide.installed && !ide.current) buttons.push(this._button('Update', 'install', ide.id));
    buttons.push(ide.installed ? this._button('Remove', 'uninstall', ide.id, true) : this._button('Install', 'install', ide.id));
    row.append(name, state, ...buttons);
    return row;
  }

  _olderToggle(count) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gs-ide-more';
    btn.textContent = IdeInstallerList.olderLabel(count, this._showOlder);
    btn.addEventListener('click', () => { this._showOlder = !this._showOlder; this.load(); });
    return btn;
  }

  _button(label, op, id, quiet = false) {
    const btn = document.createElement('button');
    btn.className = quiet ? 'gs-action-btn gs-quiet-btn' : 'gs-action-btn';
    btn.textContent = this._busy ? 'Working…' : label;
    btn.disabled = this._busy;
    btn.addEventListener('click', () => this.run(op, [id]));
    return btn;
  }
}
