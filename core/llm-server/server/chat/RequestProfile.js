const ReasoningEffort = require('../../../shared/llm/ReasoningEffort');

class RequestProfile {
  static DEFAULT_EFFORT_OFF = 'none';

  static apply(body, profile) {
    if (!body || !profile || typeof profile !== 'object') return body;
    const kwargs = RequestProfile._templateKwargs(body);
    if (profile.chatTemplateKwargs === false && kwargs) RequestProfile._hoistDial(body, kwargs, profile);
    else if (kwargs && Array.isArray(profile.effortLevels)) RequestProfile._reconcileKwargLevel(body, kwargs, profile.effortLevels);
    RequestProfile._dropFields(body, profile.dropFields);
    return body;
  }

  static mapEffortLevel(level, levels) {
    return ReasoningEffort.nearestEffort(level, levels);
  }

  static fromThinking(thinking) {
    if (!thinking || thinking.source !== 'probe') return null;
    return { effortLevels: Array.isArray(thinking.effortLevels) ? thinking.effortLevels.slice() : [] };
  }

  static _templateKwargs(body) {
    const kwargs = body.chat_template_kwargs;
    return (kwargs && typeof kwargs === 'object') ? kwargs : null;
  }

  static _hoistDial(body, kwargs, profile) {
    if (kwargs.enable_thinking === false) {
      body.reasoning_effort = profile.effortOff || RequestProfile.DEFAULT_EFFORT_OFF;
    } else if (kwargs.reasoning_effort != null) {
      const mapped = RequestProfile.mapEffortLevel(kwargs.reasoning_effort, profile.effortLevels);
      if (mapped) body.reasoning_effort = mapped;
    }
    delete body.chat_template_kwargs;
  }

  static _reconcileKwargLevel(body, kwargs, levels) {
    if (kwargs.reasoning_effort == null) return;
    const mapped = RequestProfile.mapEffortLevel(kwargs.reasoning_effort, levels);
    if (mapped) kwargs.reasoning_effort = mapped;
    else delete kwargs.reasoning_effort;
    if (Object.keys(kwargs).length === 0) delete body.chat_template_kwargs;
  }

  static _dropFields(body, fields) {
    for (const field of Array.isArray(fields) ? fields : []) {
      if (field in body) delete body[field];
    }
  }
}

module.exports = RequestProfile;
