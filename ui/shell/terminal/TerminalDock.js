import TabTerminal from './TabTerminal.js';

export default class TerminalDock {
  static PANEL_HTML = `
    <div class="terminal-dock" id="terminalDock">
      <div class="resize-handle resize-handle--row" data-resize="terminal-dock" aria-hidden="true"></div>
      <div class="terminal-dock-header">
        <span class="terminal-dock-title" id="terminalDockTitle">Terminal</span>
        <select class="terminal-dock-profile luma-field-select" id="terminalDockProfile" title="Start another terminal here" aria-label="Start another terminal here"></select>
        <button type="button" class="luma-btn" id="terminalDockToTab" title="Move this terminal to its own tab">Open in tab</button>
        <button type="button" class="icon-btn terminal-dock-close" id="terminalDockClose" title="Hide (Ctrl+\`)" aria-label="Hide terminal">&times;</button>
      </div>
      <div class="terminal-dock-stage" id="terminalDockStage"></div>
    </div>`;

  static PICK_LABEL = 'New terminal...';
  static TERMINAL_TAB = /^luma:\/\/terminal/i;
  static KEPT_ACTIONS = /^(toggle-terminal|new-terminal|next-tab|prev-tab|fullscreen|devtools|select-tab-\d|select-last-tab|zoom-in|zoom-out|zoom-reset)$/;

  constructor({ ipc, store, loadXterm, tabEvents = null, doc = document }) {
    this._ipc = ipc;
    this._store = store;
    this._loadXterm = loadXterm;
    this._tabEvents = tabEvents;
    this._doc = doc;
    this._terminals = new Map();
    this._frontTabId = null;
  }

  install() {
    const anchor = this._doc.querySelector('.settings-modal');
    if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', TerminalDock.PANEL_HTML);
    this._panel = this._doc.getElementById('terminalDock');
    this._stage = this._doc.getElementById('terminalDockStage');
    this._title = this._doc.getElementById('terminalDockTitle');
    this._picker = this._doc.getElementById('terminalDockProfile');
    this._doc.getElementById('terminalDockClose').addEventListener('click', () => this.hide());
    this._doc.getElementById('terminalDockToTab').addEventListener('click', () => this._moveToTab());
    this._picker.addEventListener('change', () => this._onPick());
    const toggle = this._doc.getElementById('terminalDockToggle');
    if (toggle) toggle.addEventListener('click', () => this.toggle());
    this._watchTabs();
  }

  isOpen() {
    return !!this._panel && this._panel.classList.contains('active');
  }

  toggle() {
    return this.isOpen() ? this.hide() : this.show();
  }

  async show() {
    const tabId = this._frontTab();
    if (!this._panel || !this._canDock(tabId)) return;
    const existing = this._terminals.get(tabId);
    if (existing) existing.open = true;
    else await this._start(tabId, null);
    this._fillPicker();
    this._showFront();
    const terminal = this._terminals.get(tabId);
    if (terminal && this.isOpen()) terminal.focus();
  }

  hide() {
    const terminal = this._terminals.get(this._frontTab());
    if (terminal) terminal.open = false;
    this._showFront();
  }

  static keepsKey(event, action) {
    const inside = !!(event.target && event.target.closest && event.target.closest('#terminalDock'));
    return !inside || event.shiftKey || TerminalDock.KEPT_ACTIONS.test(action);
  }

  _watchTabs() {
    if (!this._tabEvents) return;
    this._tabEvents.onSwitched((payload) => this._onTabInFront(payload && payload.id));
    this._tabEvents.onClosed((payload) => this._onTabClosed(payload && payload.id));
  }

  _onTabInFront(tabId) {
    this._frontTabId = tabId;
    this._showFront();
  }

  _onTabClosed(tabId) {
    this._remove(tabId, { closeSession: true });
  }

  _frontTab() {
    return this._frontTabId != null ? this._frontTabId : this._store.activeTabId;
  }

  _canDock(tabId) {
    const tab = tabId == null ? null : this._store.get(tabId);
    return !!tab && (tab.kind || 'user') === 'user' && !TerminalDock.TERMINAL_TAB.test(tab.url || '');
  }

  _showFront() {
    if (!this._panel) return;
    const front = this._terminals.get(this._frontTab()) || null;
    for (const terminal of this._terminals.values()) terminal.setVisible(terminal === front && front.open);
    this._panel.classList.toggle('active', !!front && front.open);
    this._showTitle(front ? front.session : null);
  }

  async _start(tabId, profileId) {
    await this._remove(tabId, { closeSession: true });
    const xterm = await this._loadXterm();
    const settings = (await this._ipc.invoke('core.terminal.settings')) || {};
    const terminal = new TabTerminal({
      tabId, ipc: this._ipc, doc: this._doc, parent: this._stage,
      hooks: { onSession: () => this._showFront(), onEnded: () => this._remove(tabId, { closeSession: true }) },
    });
    this._terminals.set(tabId, terminal);
    this._showFront();
    await terminal.start(xterm, { ...settings, ...this._look() }, profileId);
  }

  async _remove(tabId, { closeSession }) {
    const terminal = this._terminals.get(tabId);
    if (!terminal) return;
    this._terminals.delete(tabId);
    this._showFront();
    await terminal.end({ closeSession });
  }

  _look() {
    const view = this._doc.defaultView;
    const surface = view ? view.getComputedStyle(this._panel).backgroundColor : '';
    return { background: /^rgb/.test(surface) ? surface : undefined };
  }

  _showTitle(session) {
    const folder = session && session.cwd ? ` · ${session.cwd}` : '';
    this._title.textContent = `${(session && session.label) || 'Terminal'}${folder}`;
    this._title.title = this._title.textContent;
  }

  async _moveToTab() {
    const tabId = this._frontTab();
    const terminal = this._terminals.get(tabId);
    if (!terminal || !terminal.session) return;
    const { id, profileId, cwd } = terminal.session;
    await this._remove(tabId, { closeSession: false });
    await this._ipc.invoke('core.terminal.openTab', { sessionId: id, profileId, cwd });
  }

  async _fillPicker() {
    const profiles = (await this._ipc.invoke('core.terminal.profiles')) || [];
    this._picker.textContent = '';
    this._picker.appendChild(this._option('', TerminalDock.PICK_LABEL));
    for (const profile of profiles) this._picker.appendChild(this._option(profile.id, profile.label));
    this._picker.value = '';
  }

  _option(value, label) {
    const option = this._doc.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }

  async _onPick() {
    const profileId = this._picker.value;
    const tabId = this._frontTab();
    this._picker.value = '';
    if (!profileId || !this._canDock(tabId)) return;
    await this._start(tabId, profileId);
    const terminal = this._terminals.get(tabId);
    if (terminal) terminal.focus();
  }
}
