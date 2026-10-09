import TaskRowText from './TaskRowText.js';

export default class TimedTasksSettingsPage {
  static EXTENSION_ID = 'timed-tasks';

  static NAVIGATOR_SLOT = 'ai-chat.navigator';

  constructor(root, panelContainer) {
    this._root = root;
    this._panel = panelContainer;
    this._summaryEl = root ? root.querySelector('#ext-tt-settingsSummary') : null;
    this._modelEl = root ? root.querySelector('#ext-tt-modelLabel') : null;
    this._bindOpenPanel();
  }

  renderSummary(tasks) {
    if (this._summaryEl) this._summaryEl.textContent = TaskRowText.settingsSummary(tasks);
  }

  async loadModelLabel() {
    const el = this._modelEl;
    if (!el || !window.llmSlotAPI) return;
    try {
      const cfg = await window.llmSlotAPI.getSlotConfig(TimedTasksSettingsPage.NAVIGATOR_SLOT);
      el.textContent = cfg && cfg.model ? await TimedTasksSettingsPage._modelLabel(cfg) : 'App default (active provider)';
    } catch (_) {
      el.textContent = 'Unavailable';
    }
  }

  static async _modelLabel(cfg) {
    try {
      const models = await window.llmSlotAPI.getAllAvailableModels();
      const m = (models || []).find((x) => x.providerId === cfg.provider && x.modelId === cfg.model);
      if (m && m.label) return m.label;
    } catch (_) {}
    return cfg.model;
  }

  _bindOpenPanel() {
    const openBtn = this._root ? this._root.querySelector('#ext-tt-openPanelBtn') : null;
    if (openBtn) openBtn.addEventListener('click', () => this._openPanel());
  }

  _openPanel() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
    const toolbarBtn = document.querySelector(`.toolbar-btn[data-extension-id="${TimedTasksSettingsPage.EXTENSION_ID}"]`);
    const alreadyOpen = this._panel && !this._panel.classList.contains('ext-hidden');
    if (toolbarBtn && !alreadyOpen) toolbarBtn.click();
  }
}
