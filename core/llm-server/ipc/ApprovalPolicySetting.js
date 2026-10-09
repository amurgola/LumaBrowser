class ApprovalPolicySetting {
  static KEY = 'core.llmServer.chat.approvalPolicy';
  static DEFAULT = 'auto';

  constructor(settingsDb) {
    this._db = settingsDb;
  }

  get() {
    return { policy: ApprovalPolicySetting.normalize(this._db.get(ApprovalPolicySetting.KEY, ApprovalPolicySetting.DEFAULT)) };
  }

  set(policy) {
    const value = ApprovalPolicySetting.normalize(policy);
    this._db.set(ApprovalPolicySetting.KEY, value);
    return { policy: value };
  }

  static normalize(value) {
    return (value === 'ask' || value === 'never') ? value : ApprovalPolicySetting.DEFAULT;
  }
}

module.exports = ApprovalPolicySetting;
