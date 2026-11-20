export default class StartupModelAlert {
  static DELAY_MS = 5000;
  static PREFLIGHT_CHANNEL = 'core.llmServer.getPreflight';
  static OPEN_SETUP_CHANNEL = 'core.llmServer.openSetup';
  static REVEAL_CHANNEL = 'core.palette.reveal';
  static ACTION_LABEL = 'Choose a model';

  constructor({ log, reveal, ipc }) {
    this._log = log;
    this._reveal = reveal;
    this._ipc = ipc;
  }

  install() {
    if (!this._ipc || typeof this._ipc.invoke !== 'function') return;
    setTimeout(() => { this.check(); }, StartupModelAlert.DELAY_MS);
  }

  async check() {
    const issues = await this._selectionIssues();
    for (const issue of issues) this._alert(issue);
    return issues;
  }

  async open(issue) {
    const fix = (issue && issue.fix) || {};
    if (fix.settingId && await this._revealed(fix)) return true;
    return this.openPage(fix);
  }

  async _revealed(fix) {
    try {
      const shown = await this._ipc.invoke(StartupModelAlert.REVEAL_CHANNEL, fix.settingId, fix.selector || null);
      return !!(shown && shown.success);
    } catch (_) {
      return false;
    }
  }

  openPage(fix) {
    if (fix.kind === 'open-view') return this._ipc.invoke(StartupModelAlert.OPEN_SETUP_CHANNEL, { page: fix.view || 'settings' });
    if (fix.kind !== 'open-settings') return null;
    return this._reveal.reveal(fix.extensionId
      ? { surface: 'extension', extensionId: fix.extensionId }
      : { surface: 'shell', tab: fix.tab || 'aiproviders' });
  }

  async _selectionIssues() {
    try {
      const res = await this._ipc.invoke(StartupModelAlert.PREFLIGHT_CHANNEL);
      const issues = res && res.success && Array.isArray(res.issues) ? res.issues : [];
      return issues.filter((issue) => issue && issue.selection === true);
    } catch (_) {
      return [];
    }
  }

  _alert(issue) {
    this._log.add(issue.title, 'error', {
      action: { label: StartupModelAlert.ACTION_LABEL, run: () => { Promise.resolve(this.open(issue)).catch(() => {}); } },
    });
  }
}
