const path = require('path');
const ChatModelRef = require('./ChatModelRef');
const HarmonyModel = require('../HarmonyModel');
const ModelFamilies = require('../../server/ModelFamilies');

class ModelCapabilities {
  static NATIVE_TOOLS_SETTING = 'core.llmServer.chat.nativeToolCalls';
  static FAMILY_SETTING = 'core.llmServer.chat.plannedFamilies';

  constructor({ llmServerService, db }) {
    this._service = llmServerService;
    this._db = db;
    this._families = null;
  }

  visionActive(rawRef) {
    const modelRef = this._base(rawRef);
    if (typeof modelRef !== 'string') return false;
    if (!ChatModelRef.isLocal(modelRef)) return true;
    const plan = this._livePlan();
    return !!(plan && plan.mmprojPath);
  }

  visionSupport(rawRef) {
    const modelRef = this._base(rawRef);
    if (typeof modelRef !== 'string') return 'none';
    if (!ChatModelRef.isLocal(modelRef)) return 'active';
    const plan = this._livePlan();
    if (!plan) return 'unknown';
    if (plan.mmprojPath) return 'active';
    return plan.mmprojAvailable ? 'available' : 'none';
  }

  nativeToolsActive(rawRef) {
    const modelRef = this._base(rawRef);
    if (typeof modelRef !== 'string') return false;
    if (HarmonyModel.matches(modelRef)) return true;
    if (!ChatModelRef.isLocal(modelRef)) return true;
    const setting = this._db ? this._db.get(ModelCapabilities.NATIVE_TOOLS_SETTING, null) : null;
    if (setting === false) return false;
    const family = this._family(modelRef);
    return setting === true ? ModelFamilies.nativeToolCallsCapable(family) : ModelFamilies.nativeToolCalls(family);
  }

  nativeToolExclude(rawRef) {
    const modelRef = this._base(rawRef);
    if (!this.nativeToolsActive(modelRef)) return [];
    if (!ChatModelRef.isLocal(modelRef)) return [];
    return ModelFamilies.nativeToolExclude(this._family(modelRef));
  }

  _family(modelRef) {
    const stem = this._modelStem(modelRef);
    const plan = this._livePlan();
    if (plan && ModelCapabilities._planIsFor(plan, stem)) return this._remember(stem, plan.modelFamily || null);
    const known = this._remembered(stem);
    if (known !== undefined) return known;
    if (stem) return ModelFamilies.detect({ name: stem, weights: [] });
    return plan ? plan.modelFamily || null : null;
  }

  _remember(stem, family) {
    const key = String(stem || '').toLowerCase();
    if (!key || this._known()[key] === family) return family;
    this._families = { ...this._known(), [key]: family };
    try { if (this._db && typeof this._db.set === 'function') this._db.set(ModelCapabilities.FAMILY_SETTING, this._families); } catch (_) {}
    return family;
  }

  _remembered(stem) {
    const key = String(stem || '').toLowerCase();
    const known = this._known();
    return key && Object.prototype.hasOwnProperty.call(known, key) ? known[key] : undefined;
  }

  _known() {
    if (!this._families) {
      let stored = null;
      try { stored = this._db ? this._db.get(ModelCapabilities.FAMILY_SETTING, null) : null; } catch (_) { stored = null; }
      this._families = stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...stored } : {};
    }
    return this._families;
  }

  static _planIsFor(plan, stem) {
    const name = String((plan && plan.modelName) || '').toLowerCase();
    const want = String(stem || '').toLowerCase();
    return !!name && !!want && (want === name || want.startsWith(name));
  }

  _modelStem(modelRef) {
    const name = ChatModelRef.localName(modelRef);
    if (name) return name;
    try {
      const defaults = typeof this._service.getDefaults === 'function' ? this._service.getDefaults() : null;
      return defaults && defaults.modelPath ? path.basename(String(defaults.modelPath)) : '';
    } catch (_) {
      return '';
    }
  }

  _base(modelRef) {
    const settings = this._service && this._service.modelSettings;
    return settings && ChatModelRef.isProfile(modelRef) ? settings.baseRef(modelRef) : modelRef;
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
