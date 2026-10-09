import SettingToggle from './SettingToggle.js';

export default class LlmServerSettings {
  static CLEAR_RESET_MS = 1500;

  constructor({ feedback }) {
    this._feedback = feedback;
    this._enabled = document.getElementById('gsLlmServerEnabled');
    this._openOnLoad = document.getElementById('gsLlmDefaultTabOnLoad');
    this._openOnLoadRow = document.getElementById('gsLlmDefaultTabRow');
    this._traceRow = document.getElementById('gsLlmTraceRow');
    this._trace = document.getElementById('gsLlmTraceCalls');
    this._traceClear = document.getElementById('gsLlmTraceClear');
    this._traceForced = document.getElementById('gsLlmTraceForced');
  }

  install() {
    const invoke = (channel) => (v) => window.ipcBridge.invoke(channel, v);
    SettingToggle.wire(this._enabled, invoke('core.llmServer.setEnabled'), this._feedback, () => this.syncRows());
    SettingToggle.wire(this._openOnLoad, invoke('core.llmServer.setOpenTabOnLoad'), this._feedback);
    SettingToggle.wire(this._trace, invoke('core.llmServer.setTraceCalls'), this._feedback,
      (_v, result) => { if (result && result.data) this.applyTraceStatus(result.data); });
    if (this._traceClear) this._traceClear.addEventListener('click', () => this._clearTraces());
  }

  async load() {
    try { this._enabled.checked = await window.ipcBridge.invoke('core.llmServer.getEnabled'); } catch (e) {}
    try { this._openOnLoad.checked = await window.ipcBridge.invoke('core.llmServer.getOpenTabOnLoad'); } catch (e) {}
    try { this.applyTraceStatus(await window.ipcBridge.invoke('core.llmServer.getTraceCalls')); } catch (e) {}
    this.syncRows();
  }

  syncRows() {
    if (!this._enabled) return;
    const display = this._enabled.checked ? 'flex' : 'none';
    if (this._openOnLoadRow) this._openOnLoadRow.style.display = display;
    if (this._traceRow) this._traceRow.style.display = display;
  }

  applyTraceStatus(st) {
    if (!this._trace || !st) return;
    this._trace.checked = !!st.enabled;
    this._trace.disabled = !!st.forced;
    if (this._traceForced) this._traceForced.style.display = st.forced ? '' : 'none';
  }

  async _clearTraces() {
    const btn = this._traceClear;
    btn.disabled = true;
    const label = btn.textContent;
    try {
      const r = await window.ipcBridge.invoke('core.llmServer.clearTraces');
      btn.textContent = (r && r.success === false) ? 'Could not clear' : 'Cleared';
    } catch (e) {
      btn.textContent = 'Could not clear';
    }
    setTimeout(() => { btn.textContent = label; btn.disabled = false; }, LlmServerSettings.CLEAR_RESET_MS);
  }
}
