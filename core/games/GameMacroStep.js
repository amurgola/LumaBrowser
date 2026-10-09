class GameMacroStep {
  static KINDS = ['press', 'hold', 'mouse', 'click', 'wait'];

  static validate(step, index) {
    const kinds = step && typeof step === 'object' ? GameMacroStep.KINDS.filter((k) => step[k] != null) : [];
    if (kinds.length !== 1) throw new Error(GameMacroStep._shapeError(index));
    if (step.wait != null && !GameMacroStep._isValidWait(step.wait)) {
      throw new Error(`Macro step ${index + 1}: wait is "still", "change" or milliseconds.`);
    }
  }

  static _isValidWait(wait) {
    return wait === 'still' || wait === 'change' || Number(wait) >= 0;
  }

  static _shapeError(index) {
    return `Macro step ${index + 1} needs exactly one of ${GameMacroStep.KINDS.join(', ')}: e.g. {"press":"w","holdMs":80}, {"hold":"w","ms":600}, {"mouse":{"dx":100,"dy":0}}, {"click":{"x":10,"y":20}}, {"wait":"still"} or {"wait":300}.`;
  }
}

module.exports = GameMacroStep;
