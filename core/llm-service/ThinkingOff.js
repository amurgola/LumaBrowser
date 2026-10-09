const ThinkingOffParams = require('./ThinkingOffParams');
const NoThinkDirective = require('./NoThinkDirective');

class ThinkingOff {
  static GENERIC_EXTRA = { chatTemplateKwargs: { enable_thinking: false }, reasoningBudget: 0 };

  static resolve(modelRef, messages, thinking = null) {
    const probed = ThinkingOff.extraFromProbe(thinking);
    if (probed && probed.fixed) return { extra: null, messages, fixed: true };
    const extra = (probed && probed.extra) || ThinkingOff.extraFor(modelRef) || ThinkingOff._genericExtra();
    return { extra, messages: NoThinkDirective.apply(ThinkingOff._bareModelId(modelRef), messages), fixed: false };
  }

  static extraFor(modelRef) {
    const params = ThinkingOffParams.forModel(ThinkingOff._bareModelId(modelRef));
    const extra = {};
    const enableThinking = ThinkingOff._enableThinkingFlag(params);
    if (enableThinking !== undefined) extra.chatTemplateKwargs = { enable_thinking: enableThinking };
    if (ThinkingOff._isDisabling(params, extra)) {
      if (!extra.chatTemplateKwargs) extra.chatTemplateKwargs = { enable_thinking: false };
      extra.reasoningBudget = 0;
    }
    return extra.chatTemplateKwargs || extra.reasoningBudget !== undefined ? extra : null;
  }

  static extraFromProbe(thinking) {
    if (!thinking || thinking.source !== 'probe') return null;
    if (thinking.thinkingFixed) return { extra: null, fixed: true };
    if (thinking.disableKwarg && typeof thinking.disableKwarg === 'object') {
      return { extra: { chatTemplateKwargs: { ...thinking.disableKwarg }, reasoningBudget: 0 }, fixed: false };
    }
    return null;
  }

  static _bareModelId(modelRef) {
    return String(modelRef || '').split('::').pop();
  }

  static _genericExtra() {
    return { chatTemplateKwargs: { ...ThinkingOff.GENERIC_EXTRA.chatTemplateKwargs }, reasoningBudget: 0 };
  }

  static _enableThinkingFlag(params) {
    if (params.chat_template_kwargs && 'enable_thinking' in params.chat_template_kwargs) {
      return params.chat_template_kwargs.enable_thinking;
    }
    return 'enable_thinking' in params ? params.enable_thinking : undefined;
  }

  static _isDisabling(params, extra) {
    return (extra.chatTemplateKwargs && extra.chatTemplateKwargs.enable_thinking === false)
      || params.reasoning_effort === 'minimal' || params.reasoning_effort === 'low'
      || (params.thinking && params.thinking.type === 'disabled')
      || (params.reasoning && params.reasoning.effort === 'none')
      || (params.thinkingConfig && params.thinkingConfig.thinkingBudget === 0);
  }
}

module.exports = ThinkingOff;
