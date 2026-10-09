class ActivateToolsCall {
  static NAME = 'activate_tools';

  static execute(params, groups) {
    const requested = ActivateToolsCall._requestedKeys(params);
    const valid = requested.filter((k) => groups.availableKeys.has(k));
    const invalid = requested.filter((k) => !groups.availableKeys.has(k));
    const available = [...groups.availableKeys].join(', ') || '(none)';
    if (!requested.length) {
      return { success: false, error: `activate_tools needs "groups": an array of group keys. Available: ${available}.` };
    }
    if (!valid.length) {
      return { success: false, error: `activate_tools: none of [${requested.join(', ')}] is a valid group key. Available: ${available}.` };
    }
    groups.activate(valid);
    const note = invalid.length ? `\n\n(Ignored unknown group(s): ${invalid.join(', ')}.)` : '';
    return {
      success: true,
      activated: valid,
      message: `Activated: ${valid.join(', ')}. The full instructions are below; read them, then make your call. They stay loaded for the rest of this conversation, so don't activate them again.\n\n${groups.docsFor(valid)}${note}`,
    };
  }

  static _requestedKeys(params) {
    const raw = params && (params.groups != null ? params.groups : (params.group != null ? params.group : params.tools));
    if (Array.isArray(raw)) return raw.map(String);
    return raw ? [String(raw)] : [];
  }
}

module.exports = ActivateToolsCall;
