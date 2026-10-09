const ModelTextOverrides = require('./ModelTextOverrides');
const ModelName = require('../models/ModelName');

class LlmModelDisplayNames extends ModelTextOverrides {
  static STORAGE_KEY = 'core.llmServer.modelDisplayNames';

  constructor(settingsDb) {
    super(settingsDb, LlmModelDisplayNames.STORAGE_KEY);
  }

  resolve(stem) {
    return ModelName.resolveDisplayName({ stem, overrides: this.all() });
  }
}

module.exports = LlmModelDisplayNames;
