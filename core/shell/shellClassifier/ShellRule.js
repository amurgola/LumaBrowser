class ShellRule {
  static FORBIDDEN = 'forbidden';
  static MASS_DESTRUCTIVE = 'mass-destructive';
  static READONLY = 'readonly';
  static VERDICT_TIERS = Object.freeze(['forbidden', 'mass-destructive', 'readonly']);

  assess(command) {
    throw new Error(`${this.constructor.name} must implement assess(command)`);
  }

  static forbidden(reason) {
    return reason ? { tier: ShellRule.FORBIDDEN, reason } : null;
  }

  static massDestructive(reason) {
    return reason ? { tier: ShellRule.MASS_DESTRUCTIVE, reason } : null;
  }

  static readonly(isReadOnly) {
    return isReadOnly ? { tier: ShellRule.READONLY, reason: null } : null;
  }

  static firstApplicable(branches, ...input) {
    for (const branch of branches) {
      const result = branch(...input);
      if (result !== undefined) return result;
    }
    return undefined;
  }
}

module.exports = ShellRule;
