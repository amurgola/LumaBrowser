class CallMarkers {
  static REPAIRED = Symbol('lumaRepairedToolCall');
  static ARGS_LOST = Symbol('lumaToolArgsLost');
  static ARGS_CUT = Symbol('lumaToolArgsCut');
  static MALFORMED_TOOL = '__malformed_tool_call__';

  static transfer(call) {
    const repaired = !!call.__repaired;
    CallMarkers._carry(call, repaired, CallMarkers.REPAIRED, true);
    CallMarkers._carry(call, call.__argsLost, CallMarkers.ARGS_LOST, call.__argsLost);
    CallMarkers._carry(call, call.__argsCut, CallMarkers.ARGS_CUT, true);
    delete call.__coerced;
    delete call.__repaired;
    delete call.__argsLost;
    delete call.__argsCut;
    return repaired;
  }

  static isRepaired(params) {
    return !!(params && params[CallMarkers.REPAIRED]);
  }

  static lostArguments(params) {
    return (params && params[CallMarkers.ARGS_LOST]) || null;
  }

  static wasCut(params) {
    return !!(params && params[CallMarkers.ARGS_CUT]);
  }

  static _carry(call, present, key, value) {
    if (present && call.params && typeof call.params === 'object') call.params[key] = value;
  }
}

module.exports = CallMarkers;
