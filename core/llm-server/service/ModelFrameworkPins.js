const ModelTextOverrides = require('./ModelTextOverrides');
const ModelName = require('../models/ModelName');

class ModelFrameworkPins extends ModelTextOverrides {
  static STORAGE_KEY = 'core.llmServer.modelFrameworks';

  constructor(settingsDb) {
    super(settingsDb, ModelFrameworkPins.STORAGE_KEY);
  }

  resolve(modelPathOrStem) {
    if (!modelPathOrStem) return '';
    return this.get(ModelName.key(modelPathOrStem));
  }

  setForModel(modelPath, frameworkId) {
    return this.set(ModelName.key(modelPath), frameworkId);
  }
}

module.exports = ModelFrameworkPins;
