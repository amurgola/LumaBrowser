const path = require('path');
const ChatModelRef = require('./ChatModelRef');

class LocalSpeculationInfo {
  constructor({ llmServerService }) {
    this._service = llmServerService;
  }

  forRef(rawRef) {
    const ref = this._base(rawRef);
    if (typeof ref !== 'string' || !ChatModelRef.isLocal(ref)) return null;
    try {
      const status = this._service.runtimeServer.getStatus();
      return LocalSpeculationInfo.describe(status && status.plan);
    } catch (_) {
      return null;
    }
  }

  static describe(plan) {
    if (!plan || typeof plan !== 'object') return null;
    if (plan.drafterPath) {
      const file = path.basename(String(plan.drafterPath));
      return { kind: 'drafter', label: `drafter ${file}`, file, specType: plan.specType || null, draftNMax: plan.specDraftNMax || null };
    }
    if (plan.mtp) {
      const detached = !!plan.mtp.headPath;
      return {
        kind: 'mtp', label: detached ? 'MTP head (separate file)' : 'MTP head (built into the weights)',
        specType: plan.mtp.type || plan.specType || null, draftNMax: plan.mtp.draftNMax || null,
      };
    }
    if (plan.ngramSpec) return { kind: 'ngram', label: 'n-gram lookup (no draft model)', specType: 'ngram-mod' };
    return { kind: 'none', label: 'none' };
  }

  _base(ref) {
    const settings = this._service && this._service.modelSettings;
    return settings && ChatModelRef.isProfile(ref) ? settings.baseRef(ref) : ref;
  }
}

module.exports = LocalSpeculationInfo;
