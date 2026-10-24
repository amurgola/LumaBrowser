export default class IdeInstallerList {
  static JETBRAINS = {
    ns: 'idePlugin',
    prefix: 'gsIdePlugin',
    copy: {
      noun: 'Plugin', one: 'IDE', many: 'IDEs',
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
    copy: {
      noun: 'Extension', one: 'editor', many: 'editors',
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
    copy: {
      noun: 'Mod', one: 'mod', many: 'mods',
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
    this._copy = config.copy;
    this._list = document.getElementById(`${config.prefix}List`);
    this._help = document.getElementById(`${config.prefix}Help`);
    this._installAll = document.getElementById(`${config.prefix}InstallAll`);
    this._refresh = document.getElementById(`${config.prefix}Refresh`);
    this._defaultHelp = this._help ? this._help.textContent : '';
    this._busy = false;
  }

  install() {
    if (this._installAll) this._installAll.addEventListener('click', () => this.run('install', []));
    if (this._refresh) this._refresh.addEventListener('click', () => this.load());
  }

  async load() {
    if (!this._list) return;
    let s = null;
    try { s = await window.ipcBridge.invoke(`core.settings.${this._ns}.status`); } catch (_) { s = null; }
    this._list.innerHTML = '';
    if (!s || s.success === false || !s.available) {
      if (this._help) this._help.textContent = (s && s.error) || this._copy.notBundled;
      if (this._installAll) this._installAll.disabled = true;
      return;
    }
    if (this._help) this._help.textContent = this._defaultHelp + (s.sourceVersion ? ` ${this._copy.noun} version ${s.sourceVersion}.` : '') + (s.summary ? ` ${s.summary}` : '');
    this._renderRows(s);
  }

  async run(op, ids) {
    if (this._busy) return;
    this._busy = true;
    if (this._installAll) this._installAll.disabled = true;
    this._list.querySelectorAll('button').forEach((b) => { b.disabled = true; b.textContent = 'Working…'; });
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

  _report(op, r) {
    const [message, kind] = IdeInstallerList.outcome(op, r, this._copy);
    this._feedback.toast(message, kind);
  }

  _renderRows(s) {
    const ides = Array.isArray(s.ides) ? s.ides : [];
    if (this._installAll) this._installAll.disabled = !ides.length || this._busy;
    if (!ides.length) {
      const empty = document.createElement('div');
      empty.className = 'gs-ide-empty';
      empty.textContent = s.emptyReason || this._copy.noneFound;
      this._list.appendChild(empty);
      return;
    }
    for (const ide of ides) this._list.appendChild(this._row(ide, s.sourceVersion));
  }

  static stateText(ide, sourceVersion, copy) {
    if (!ide.installed) return 'Not installed';
    if (ide.current) return `Installed${ide.installedVersion ? ` (v${ide.installedVersion})` : ''}. ${copy.restartHint}`;
    if (copy.staleText) return copy.staleText(ide, sourceVersion);
    return `Installed v${ide.installedVersion || '?'}, will update to v${sourceVersion} on next start.`;
  }

  _row(ide, sourceVersion) {
    const row = document.createElement('div');
    row.className = 'gs-ide-row' + (ide.latest ? '' : ' old');
    const name = document.createElement('span');
    name.className = 'gs-ide-name';
    name.textContent = ide.label;
    const state = document.createElement('span');
    state.className = 'gs-ide-state' + (ide.installed ? ' on' : '');
    state.textContent = IdeInstallerList.stateText(ide, sourceVersion, this._copy);
    if (ide.description) name.title = ide.description;
    const buttons = [];
    if (this._copy.updateInPlace && ide.installed && !ide.current) buttons.push(this._button('Update', 'install', ide.id));
    buttons.push(this._button(ide.installed ? 'Remove' : 'Install', ide.installed ? 'uninstall' : 'install', ide.id));
    row.append(name, state, ...buttons);
    return row;
  }

  _button(label, op, id) {
    const btn = document.createElement('button');
    btn.className = 'gs-action-btn';
    btn.textContent = this._busy ? 'Working…' : label;
    btn.disabled = this._busy;
    btn.addEventListener('click', () => this.run(op, [id]));
    return btn;
  }
}
