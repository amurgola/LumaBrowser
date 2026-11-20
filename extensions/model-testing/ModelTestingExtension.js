const ModelTestingActions = require('./ModelTestingActions');
const TestModels = require('./TestModels');
const TestSuiteCatalog = require('./TestSuiteCatalog');
const TestSession = require('./session/TestSession');

class ModelTestingExtension {
  static NOT_READY = 'The LLM server is not ready yet. Reopen this tab in a moment.';

  constructor() {
    this._session = null;
    this._actions = null;
  }

  async activate(context) {
    context.setupTab.onInvoke((action, payload) => this.handleInvoke(action, payload));
    return {};
  }

  async deactivate() {
    if (this._session) this._session.cancel();
    this._session = null;
    this._actions = null;
  }

  async handleInvoke(action, payload) {
    return this._ensureActions().handle(action, payload);
  }

  _ensureActions() {
    if (this._actions) return this._actions;
    const chatRouter = global.__lumaChatRouter;
    if (!chatRouter || !chatRouter.llmServerService) throw new Error(ModelTestingExtension.NOT_READY);
    const llmServerService = chatRouter.llmServerService;
    const catalog = new TestSuiteCatalog({ llmServerService, chatRouter });
    this._session = new TestSession({ llmServerService, chatRouter, catalog });
    this._actions = new ModelTestingActions({ session: this._session, catalog, models: new TestModels({ llmServerService }), llmServerService });
    return this._actions;
  }
}

module.exports = ModelTestingExtension;
