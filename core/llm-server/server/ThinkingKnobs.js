const ReasoningEffort = require('../../shared/llm/ReasoningEffort');

class ThinkingKnobs {
  static extra(body, hostFallback = null) {
    return new ThinkingKnobs(body, hostFallback).execute();
  }

  static apply(body, hostFallback) {
    const extra = ThinkingKnobs.extra(body, hostFallback);
    if (extra && extra.chatTemplateKwargs) body.chat_template_kwargs = extra.chatTemplateKwargs;
    if (extra && extra.reasoningBudget !== undefined) body.reasoning_budget = extra.reasoningBudget;
    delete body.enable_thinking;
    return body;
  }

  static refusal(body, thinking) {
    if (!thinking || thinking.source !== 'probe' || !thinking.thinkingFixed) return null;
    if (!ThinkingKnobs._asksOff(body)) return null;
    const levels = Array.isArray(thinking.effortLevels) && thinking.effortLevels.length
      ? thinking.effortLevels.join(', ') : 'default';
    return {
      code: 'thinking_cannot_be_disabled',
      message: `This model always reasons: its chat template has no way to turn thinking off. Supported reasoning_effort values: ${levels}.`,
    };
  }

  constructor(body, hostFallback) {
    this._body = body;
    this._hostFallback = hostFallback;
    this._effort = typeof body.reasoning_effort === 'string' ? ReasoningEffort.normalizeDial(body.reasoning_effort) : null;
    this._extra = {};
  }

  execute() {
    this._applyDial();
    this._applyNativeFields();
    this._applyEnableThinking();
    return this._result();
  }

  _applyDial() {
    const dial = this._effort || (this._clientSaidSomething() ? null : this._hostDial());
    if (dial === 'off') {
      this._extra.chatTemplateKwargs = { enable_thinking: false };
      this._extra.reasoningBudget = 0;
    } else if (dial) {
      const level = ReasoningEffort.extraFor(dial);
      if (level) this._extra.chatTemplateKwargs = { ...level.chatTemplateKwargs };
    }
  }

  _applyNativeFields() {
    if (ThinkingKnobs._isObject(this._body.chat_template_kwargs)) {
      this._extra.chatTemplateKwargs = { ...this._body.chat_template_kwargs };
    }
    if (typeof this._body.reasoning_budget === 'number') this._extra.reasoningBudget = this._body.reasoning_budget;
  }

  _applyEnableThinking() {
    const enabled = this._enableThinkingStatement();
    if (enabled === false || enabled === 'false') {
      this._extra.chatTemplateKwargs = { ...(this._extra.chatTemplateKwargs || {}), enable_thinking: false };
      if (this._extra.reasoningBudget === undefined) this._extra.reasoningBudget = 0;
    } else if (enabled === true || enabled === 'true') {
      this._extra.chatTemplateKwargs = { ...(this._extra.chatTemplateKwargs || {}), enable_thinking: true };
    }
  }

  _enableThinkingStatement() {
    if (this._body.enable_thinking !== undefined) return this._body.enable_thinking;
    if (this._effort === 'off') return false;
    const kwargs = this._extra.chatTemplateKwargs;
    return (kwargs && 'enable_thinking' in kwargs) ? kwargs.enable_thinking : undefined;
  }

  _clientSaidSomething() {
    return this._effort !== null
      || this._body.enable_thinking !== undefined
      || typeof this._body.reasoning_budget === 'number'
      || ThinkingKnobs._isObject(this._body.chat_template_kwargs);
  }

  _hostDial() {
    return this._hostFallback ? ReasoningEffort.normalizeDial(this._hostFallback) : null;
  }

  _result() {
    return (this._extra.chatTemplateKwargs || this._extra.reasoningBudget !== undefined) ? this._extra : null;
  }

  static _asksOff(body) {
    const kwargs = body && body.chat_template_kwargs;
    const isObject = ThinkingKnobs._isObject(kwargs);
    return (isObject && kwargs.enable_thinking === false)
      || (!!body && body.reasoning_budget === 0)
      || (isObject && kwargs.reasoning_effort === 'none');
  }

  static _isObject(value) {
    return !!value && typeof value === 'object';
  }
}

module.exports = ThinkingKnobs;
