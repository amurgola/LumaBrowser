const TokenEstimator = require('../../shared/text/TokenEstimator');
const BoundedJson = require('./outline/BoundedJson');
const ProfileWalker = require('./outline/ProfileWalker');
const OutlineTreeBuilder = require('./outline/OutlineTreeBuilder');
const OutlineBudget = require('./outline/OutlineBudget');
const OutlineRenderer = require('./outline/OutlineRenderer');

class JsonOutliner {
  static DEFAULT_BUDGET_TOKENS = 500;
  static LEGEND = '(outline: one JSONPath per line; [*] = every element, ? = optional field)';

  static outline(value, budgetTokens = JsonOutliner.DEFAULT_BUDGET_TOKENS) {
    const budget = JsonOutliner._usableBudget(budgetTokens);
    const whole = JsonOutliner._wholeIfItFits(value, budget);
    if (whole !== null) return whole;
    const tree = OutlineTreeBuilder.build(ProfileWalker.profile(value));
    const plan = new OutlineBudget(budget - OutlineBudget.cost(JsonOutliner.LEGEND)).select(tree);
    return `${JsonOutliner.LEGEND}\n${OutlineRenderer.render(tree, plan)}`;
  }

  static _usableBudget(budgetTokens) {
    return Number.isFinite(budgetTokens) && budgetTokens > 0 ? budgetTokens : JsonOutliner.DEFAULT_BUDGET_TOKENS;
  }

  static _wholeIfItFits(value, budget) {
    const compact = BoundedJson.stringify(value, TokenEstimator.tokensToChars(budget));
    if (compact === null) return null;
    const indented = JSON.stringify(value, null, 2);
    if (indented === undefined) return compact;
    return TokenEstimator.estimateTokens(indented) <= budget ? indented : compact;
  }
}

module.exports = JsonOutliner;
