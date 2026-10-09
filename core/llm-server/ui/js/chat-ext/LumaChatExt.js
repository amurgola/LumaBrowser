import ChatExtRegistry from './ChatExtRegistry.js';
import SchemaPresenter from './SchemaPresenter.js';
import ChatExtStyles from './ChatExtStyles.js';
import AssistField from './AssistField.js';
import ImageGenerator from './ImageGenerator.js';

export default class LumaChatExt {
  static PUBLIC_METHODS = ['generateImage', 'attachAssist', 'openSchemaModal', 'openSchemaInline', 'registerMode',
    'getBackend', 'getClient', 'getMerged', 'list', 'hasModes', 'load'];

  static install(win = window) {
    if (!win.LumaChatExt) win.LumaChatExt = new LumaChatExt();
    return win.LumaChatExt;
  }

  constructor({ registry = new ChatExtRegistry(), presenter = new SchemaPresenter() } = {}) {
    this._registry = registry;
    this._presenter = presenter;
    for (const name of LumaChatExt.PUBLIC_METHODS) this[name] = this[name].bind(this);
  }

  generateImage(api, opts) {
    return ImageGenerator.generate(api, opts);
  }

  attachAssist(input, field, opts = {}) {
    ChatExtStyles.ensure();
    const api = opts.api || window.llmDiagAPI;
    const model = opts.model || {};
    if (!field.key) field.key = '_value';
    if (model[field.key] == null) model[field.key] = input.value || '';
    input.addEventListener('input', () => { model[field.key] = input.value; });
    const statusHost = opts.statusHost || input.parentNode;
    new AssistField(statusHost, input, field, {
      api, model, rootModel: opts.rootModel || model, siblingModel: opts.siblingModel || null,
    }).attach();
    return model;
  }

  openSchemaModal(schema, opts = {}) {
    return this._presenter.openModal(schema, opts);
  }

  openSchemaInline(schema, opts = {}) {
    return this._presenter.openInline(schema, opts);
  }

  registerMode(def) {
    this._registry.registerMode(def);
  }

  getBackend(id) {
    return this._registry.getBackend(id);
  }

  getClient(id) {
    return this._registry.getClient(id);
  }

  getMerged(id) {
    return this._registry.getMerged(id);
  }

  list() {
    return this._registry.list();
  }

  hasModes() {
    return this._registry.hasModes();
  }

  load(api) {
    return this._registry.load(api);
  }
}
