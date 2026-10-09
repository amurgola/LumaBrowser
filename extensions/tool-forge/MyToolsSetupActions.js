const ToolRecordView = require('./ToolRecordView');

class MyToolsSetupActions {
  constructor({ store, configStore, host, service, files }) {
    this._store = store;
    this._config = configStore;
    this._host = host;
    this._service = service;
    this._files = files;
  }

  async invoke(action, payload = {}) {
    if (!Object.hasOwn(MyToolsSetupActions._ACTIONS, action)) throw new Error(`Unknown action: ${action}`);
    return this[MyToolsSetupActions._ACTIONS[action]](payload || {});
  }

  _list() {
    return {
      tools: this._store.list().map((tool) => ToolRecordView.listRow(tool, this._config)),
      encryptionAvailable: this._config.encryptionAvailable(),
    };
  }

  _code(payload) {
    const tool = this._require(payload.name);
    return { name: tool.name, code: tool.code };
  }

  _get(payload) {
    return { tool: ToolRecordView.editorRecord(this._require(payload.name), this._config) };
  }

  async _save(payload) {
    const result = await this._service.createTool({ name: payload.name, ...(payload.patch || {}) });
    this._host.refresh();
    return result;
  }

  _publish(payload) {
    return this._service.publishTool({ name: payload.name });
  }

  _setConfig(payload) {
    const tool = this._require(payload.name);
    return { config: this._config.setValues(tool.name, payload.values || {}, tool.configSlots || []) };
  }

  _delete(payload) {
    const tool = this._store.get(payload.name);
    if (!tool) return { removed: false };
    this._store.delete(tool.id);
    this._config.clear(tool.name);
    this._host.refresh();
    return { removed: true };
  }

  _test(payload) {
    const tool = this._require(payload.name);
    return this._service.testTool({ name: tool.name, args: payload.args || {}, configOverrides: payload.configOverrides || null });
  }

  _export(payload) {
    return this._files.exportTool(payload.name);
  }

  _import() {
    return this._files.importTool();
  }

  _require(name) {
    const tool = this._store.get(name);
    if (!tool) throw new Error('Tool not found');
    return tool;
  }

  static _ACTIONS = {
    list: '_list',
    'code.get': '_code',
    get: '_get',
    save: '_save',
    publish: '_publish',
    'config.set': '_setConfig',
    delete: '_delete',
    test: '_test',
    export: '_export',
    import: '_import',
  };
}

module.exports = MyToolsSetupActions;
