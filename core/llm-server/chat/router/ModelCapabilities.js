const ChatModelRef = require('./ChatModelRef');
const HarmonyModel = require('../HarmonyModel');
const ModelFamilies = require('../../server/ModelFamilies');

class ModelCapabilities {
  static NATIVE_TOOLS_SETTING = 'core.llmServer.chat.nativeToolCalls';

  constructor({ llmServerService, db }) {
    this._service = llmServerService;
    this._db = db;
  }

  visionActive(modelRef) {
    if (typeof modelRef !== 'string') return false;
    if (!ChatModelRef.isLocal(modelRef)) return true;
    const plan = this._livePlan();
    return !!(plan && plan.mmprojPath);
  }

  nativeToolsActive(modelRef) {
    if (typeof modelRef !== 'string') return false;
    if (HarmonyModel.matches(modelRef)) return true;
    if (!ChatModelRef.isLocal(modelRef)) return true;
    const setting = this._db ? this._db.get(ModelCapabilities.NATIVE_TOOLS_SETTING, null) : null;
    if (setting === false) return false;
    const plan = this._livePlan();
    const family = plan && plan.modelFamily;
    return setting === true ? ModelFamilies.nativeToolCallsCapable(family) : ModelFamilies.nativeToolCalls(family);
  }

  nativeToolExclude(modelRef) {
    if (!this.nativeToolsActive(modelRef)) return [];
    if (!ChatModelRef.isLocal(modelRef)) return [];
    const plan = this._livePlan();
    return ModelFamilies.nativeToolExclude(plan && plan.modelFamily);
  }

  _livePlan() {
    try {
      const status = this._service.runtimeServer.getStatus();
      return (status && status.plan) || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ModelCapabilities;
