const ModelTextOverrides = require('./ModelTextOverrides');
const ModelName = require('../models/ModelName');

class ModelLaunchFlags extends ModelTextOverrides {
  static STORAGE_KEY = 'core.llmServer.modelLaunchFlags';

  constructor(settingsDb) {
    super(settingsDb, ModelLaunchFlags.STORAGE_KEY);
  }

  resolve(modelPathOrStem) {
    if (!modelPathOrStem) return '';
    return this.get(ModelName.key(modelPathOrStem));
  }

  setForModel(modelPath, text) {
    return this.set(ModelName.key(modelPath), text);
  }
}

module.exports = ModelLaunchFlags;
