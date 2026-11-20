class ModelTestingActions {
  constructor({ session, catalog, models, llmServerService }) {
    this._session = session;
    this._catalog = catalog;
    this._models = models;
    this._svc = llmServerService;
    this._routes = {
      state: () => this._state(),
      run: (payload) => session.run(payload),
      cancel: () => session.cancel(),
      status: () => session.status(),
      raw: (payload) => session.raw(payload.suiteId),
    };
  }

  async handle(action, payload) {
    const route = this._routes[action];
    if (!route) throw new Error(`Unknown action: ${action}`);
    return route(payload || {});
  }

  async _state() {
    return {
      models: await this._models.list(),
      suites: this._catalog.describe(),
      results: this._catalog.results(),
      run: this._session.status(),
      raw: this._session.rawIndex(),
      fitTestRunning: !!this._svc.fitTestRunning,
    };
  }
}

module.exports = ModelTestingActions;
