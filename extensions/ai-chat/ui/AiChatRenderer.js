import AiChatMarkup from './AiChatMarkup.js';
import AiChatSettingsTab from './AiChatSettingsTab.js';
import LitePanel from './lite-panel/LitePanel.js';

export default class AiChatRenderer {
  static FIRST_CHECK_DELAY_MS = 500;

  constructor() {
    this._settings = null;
  }

  async activate(context) {
    this._registerSettingsTab(context);
    AiChatRenderer._injectPanel();
    AiChatRenderer._injectModals();
    this._publishPanel();
    if (this._settings) await this._settings.load();
  }

  _registerSettingsTab(context) {
    const container = context.slotManager.register('settings-tab', 'ai-chat', AiChatMarkup.SETTINGS_HTML, {
      label: 'AI Chat',
      tabId: 'ai-chat',
      onActivate: () => this._settings && this._settings.load(),
    });
    if (!container) return;
    this._settings = new AiChatSettingsTab({
      container,
      ipc: context.ipcBridge,
      getChatApi: () => (window.lumaAiChatPanel ? window.lumaAiChatPanel.api : null),
    });
    this._settings.bind();
  }

  static _injectPanel() {
    if (document.getElementById('aiChatPanel')) return;
    const settingsModal = document.querySelector('.settings-modal');
    if (!settingsModal) return;
    const holder = document.createElement('div');
    holder.innerHTML = AiChatMarkup.CHAT_PANEL_HTML;
    settingsModal.parentNode.insertBefore(holder.firstElementChild, settingsModal);
  }

  static _injectModals() {
    if (document.getElementById('aiChatConfirmModal')) return;
    const holder = document.createElement('div');
    holder.innerHTML = AiChatMarkup.CHAT_MODALS_HTML;
    document.body.appendChild(holder);
  }

  _publishPanel() {
    if (window.lumaAiChatPanel) return;
    window.lumaAiChatPanel = new LitePanel();
    setTimeout(() => {
      if (window.lumaAiChatPanel) window.lumaAiChatPanel.checkLlmAvailability();
    }, AiChatRenderer.FIRST_CHECK_DELAY_MS);
  }
}
