const ShellRule = require('./ShellRule');
const GitRule = require('./rules/GitRule');
const FilesystemRule = require('./rules/FilesystemRule');
const SystemRule = require('./rules/SystemRule');
const PackagesRule = require('./rules/PackagesRule');
const ReadOnlyRule = require('./rules/ReadOnlyRule');

class ShellRuleSet {
  static RULES = Object.freeze([new GitRule(), new FilesystemRule(), new SystemRule(), new PackagesRule(), new ReadOnlyRule()]);

  static assess(command, { readonlyEligible = true } = {}) {
    const verdicts = ShellRuleSet.RULES.map((rule) => rule.assess(command)).filter(Boolean);
    return ShellRuleSet._first(verdicts, ShellRule.FORBIDDEN)
      || ShellRuleSet._first(verdicts, ShellRule.MASS_DESTRUCTIVE)
      || (readonlyEligible ? ShellRuleSet._first(verdicts, ShellRule.READONLY) : null);
  }

  static _first(verdicts, tier) {
    return verdicts.find((verdict) => verdict.tier === tier) || null;
  }
}

module.exports = ShellRuleSet;
