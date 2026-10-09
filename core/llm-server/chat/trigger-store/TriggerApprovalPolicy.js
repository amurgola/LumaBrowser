const TriggerPolicy = require('./TriggerPolicy');

class TriggerApprovalPolicy extends TriggerPolicy {
  static MODES = ['auto', 'ask'];
  static MAX_APPROVED_TOOLS = 50;

  static normalizeInto(source, out) {
    if (source.approval === 'ask') out.approval = 'ask';
    const names = TriggerApprovalPolicy._toolNames(source.approvedTools);
    if (names.length) out.approvedTools = names;
    return out;
  }

  static of(trigger) {
    const s = TriggerPolicy.sourceOf(trigger);
    return {
      mode: TriggerApprovalPolicy.MODES.includes(s.approval) ? s.approval : 'auto',
      approvedTools: Array.isArray(s.approvedTools) ? s.approvedTools.slice() : [],
    };
  }

  static withTool(trigger, name) {
    return [...new Set([...(TriggerPolicy.sourceOf(trigger).approvedTools || []), name])];
  }

  static _toolNames(list) {
    if (!Array.isArray(list)) return [];
    const trimmed = list.map((n) => String(n || '').trim()).filter(Boolean);
    return [...new Set(trimmed)].slice(0, TriggerApprovalPolicy.MAX_APPROVED_TOOLS);
  }
}

module.exports = TriggerApprovalPolicy;
