class ApprovalPolicy {
  static SETTING = 'core.llmServer.chat.approvalPolicy';

  static resolve({ setting, interactive } = {}) {
    const value = String(setting || 'auto');
    if (value === 'ask' || value === 'never') return value;
    return interactive ? 'ask' : 'never';
  }

  static resolveRun({ override, setting, interactive } = {}) {
    if (override === 'ask' || override === 'never') return override;
    return ApprovalPolicy.resolve({ setting, interactive });
  }
}

module.exports = ApprovalPolicy;
