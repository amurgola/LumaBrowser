import TriggerForm from './TriggerForm.js';
import TriggerChoices from './TriggerChoices.js';
import TriggerCard from './TriggerCard.js';

export default class TriggerMode {
  static ID = 'trigger';

  constructor(chatExt, { card = new TriggerCard() } = {}) {
    this._chatExt = chatExt;
    this.card = card;
  }

  register() {
    if (!this._chatExt || !this._chatExt.registerMode) return;
    this._chatExt.registerMode(this.hooks());
  }

  hooks() {
    return {
      id: TriggerMode.ID,
      openSetup: (api, ctx) => this._openSetup(api, ctx),
      startConversation: (api, ctx, data) => this._startConversation(api, ctx, data),
      decorateComposer: (els, ctx) => this.card.decorate(els, ctx),
      onLeaveConversation: () => this.card.leave(),
    };
  }

  async _openSetup(api, ctx) {
    const host = ctx && typeof ctx.setupHost === 'function' ? ctx.setupHost() : null;
    const state = this.card.state;
    state.agentChoices = await TriggerChoices.agents(api);
    state.tabChoices = await TriggerChoices.persistedTabs(api);
    const schema = TriggerForm.schemaFor(state.agentChoices, state.tabChoices);
    const opts = { api, host, initial: { ...TriggerForm.INITIAL } };
    return host && this._chatExt.openSchemaInline
      ? this._chatExt.openSchemaInline(schema, opts)
      : this._chatExt.openSchemaModal(schema, opts);
  }

  async _startConversation(_api, ctx, data) {
    if (!data || !String(data.prompt || '').trim()) return;
    const state = this.card.state;
    ctx.sendTurn(TriggerForm.openingTurn(data, { agents: state.agentChoices, tabs: state.tabChoices }));
  }
}
