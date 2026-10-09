import ConversationExport from './ConversationExport.js';

export default class AiChatSettingsTab {
  static SLOT_ID = 'ai-chat.navigator';
  static DEFAULT_OPTION = '<option value="">Use active provider (default)</option>';

  constructor({ container, ipc, getChatApi }) {
    this._ipc = ipc;
    this._getChatApi = getChatApi;
    const q = (id) => container.querySelector(`#${id}`);
    this._modelSelect = q('ext-ac-modelSelect');
    this._systemPrompt = q('ext-ac-systemPrompt');
    this._exportBtn = q('ext-ac-exportBtn');
  }

  bind() {
    this._modelSelect.addEventListener('change', () => this.saveModelSlot());
    if (this._systemPrompt) this._systemPrompt.addEventListener('change', () => this.savePreferences());
    this._exportBtn.addEventListener('click', () => this.exportAll());
  }

  async load() {
    try {
      const prefs = await this._invoke('getPreferences');
      if (this._systemPrompt) this._systemPrompt.value = prefs.systemPrompt || '';
      await this._populateModels();
    } catch (e) {
      console.error('ai-chat: failed to load settings:', e);
    }
  }

  async savePreferences() {
    try {
      await this._invoke('savePreferences', {
        systemPrompt: this._systemPrompt ? this._systemPrompt.value : '',
      });
    } catch (e) {
      console.error('ai-chat: failed to save settings:', e);
    }
  }

  async saveModelSlot() {
    const slots = window.llmSlotAPI;
    if (!slots) return;
    const val = this._modelSelect.value;
    try {
      if (val) {
        const [provider, model] = val.split('::');
        await slots.setSlotConfig(AiChatSettingsTab.SLOT_ID, provider, model);
      } else {
        await slots.clearSlotConfig(AiChatSettingsTab.SLOT_ID);
      }
    } catch (e) {
      console.error('ai-chat: failed to save model slot:', e);
    }
  }

  async exportAll() {
    try {
      const api = this._getChatApi();
      if (!api) throw new Error('chat panel is not loaded');
      await ConversationExport.download(api);
    } catch (e) {
      console.error('ai-chat: export failed:', e);
    }
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.ai-chat.${channel}`, ...args);
  }

  async _populateModels() {
    const slots = window.llmSlotAPI;
    if (!this._modelSelect || !slots) return;
    this._modelSelect.innerHTML = AiChatSettingsTab.DEFAULT_OPTION;
    try {
      const [models, slotConfig] = await Promise.all([
        slots.getAllAvailableModels(),
        slots.getSlotConfig(AiChatSettingsTab.SLOT_ID),
      ]);
      const current = { provider: (slotConfig && slotConfig.provider) || '', model: (slotConfig && slotConfig.model) || '' };
      for (const model of models) this._modelSelect.appendChild(AiChatSettingsTab._option(model, current));
    } catch (e) {
      console.error('ai-chat: failed to populate models:', e);
    }
  }

  static _option(model, current) {
    const option = document.createElement('option');
    option.value = `${model.providerId}::${model.modelId}`;
    option.textContent = model.label;
    if (model.providerId === current.provider && model.modelId === current.model) option.selected = true;
    return option;
  }
}
