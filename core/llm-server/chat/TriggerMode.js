const ChatModeRegistry = require('./ChatModeRegistry');
const TriggerModePrompt = require('./trigger-mode/TriggerModePrompt');
const TriggerModeServices = require('./trigger-mode/TriggerModeServices');
const TriggerPromptExtras = require('./trigger-mode/TriggerPromptExtras');
const TriggerTools = require('./trigger-mode/TriggerTools');

class TriggerMode {
  static ID = 'trigger';
  static TEMPERATURE = 0.3;

  constructor({ triggerStore, emitEvent = () => {}, registry = ChatModeRegistry.shared, ...getters } = {}) {
    if (!triggerStore) throw new Error('TriggerMode requires a triggerStore');
    this._store = triggerStore;
    this._registry = registry;
    this._services = new TriggerModeServices(getters);
    this._tools = new TriggerTools({ triggerStore, services: this._services, emitEvent });
  }

  register() {
    this._registry.register(this.descriptor());
    return this;
  }

  unregister() {
    return this._registry.unregister(TriggerMode.ID);
  }

  descriptor() {
    return {
      id: TriggerMode.ID,
      label: 'Trigger',
      icon: String.fromCodePoint(0x26a1),
      description: 'React to inbound events: a webhook the AI answers with a prompt or an agent run, tested before it goes live.',
      requirements: ['llm'],
      launcher: 'sidebar',
      agent: true,
      buildTurn: (args) => this.buildTurn(args),
    };
  }

  buildTurn({ conversationId } = {}) {
    const trigger = conversationId ? this._store.getByConversation(conversationId) : null;
    const tools = this._tools.build();
    return {
      systemPrompt: this._systemPrompt(trigger, conversationId),
      temperature: TriggerMode.TEMPERATURE,
      agent: true,
      tools,
      allowedTools: tools.map((t) => t.name),
      noBrowser: true,
    };
  }

  _systemPrompt(trigger, conversationId) {
    return TriggerModePrompt.build(
      trigger,
      this._services.runToolGroups(conversationId),
      this._services.hookBaseUrls(),
      TriggerPromptExtras.build(this._services, this._store, trigger),
    );
  }
}

module.exports = TriggerMode;
