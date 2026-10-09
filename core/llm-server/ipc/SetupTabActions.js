const SetupTabRegistry = require('../chat/SetupTabRegistry');

class SetupTabActions {
  static ARGS_REQUIRED = 'extId and action are required';

  constructor(registry = SetupTabRegistry.shared) {
    this._registry = registry;
  }

  list() {
    return { tabs: this._registry.list() };
  }

  async invoke(args) {
    const { extId, action, payload } = args || {};
    if (!extId || !action) return { success: false, error: SetupTabActions.ARGS_REQUIRED };
    return { result: await this._registry.invoke(extId, action, payload) };
  }
}

module.exports = SetupTabActions;
