import ConversationExport from './ConversationExport.js';
import SlotModelOptions from '../../../core/llm-server/ui/js/models/SlotModelOptions.js';

export default class AiChatSettingsTab {
  static SLOT_ID = 'ai-chat.navigator';

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
    const picked = SlotModelOptions.parse(this._modelSelect.value);
    try {
      if (picked) await slots.setSlotConfig(AiChatSettingsTab.SLOT_ID, picked.provider, picked.model);
      else await slots.clearSlotConfig(AiChatSettingsTab.SLOT_ID);
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
    SlotModelOptions.fill(this._modelSelect, [], null);
    try {
      const [models, slotConfig] = await Promise.all([
        slots.getAllAvailableModels(),
        slots.getSlotConfig(AiChatSettingsTab.SLOT_ID),
      ]);
      SlotModelOptions.fill(this._modelSelect, models, slotConfig);
    } catch (e) {
      console.error('ai-chat: failed to populate models:', e);
    }
  }
}
