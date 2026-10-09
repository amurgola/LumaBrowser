const TokenEstimator = require('../../../shared/text/TokenEstimator');

class OutlineBudget {
  static cost(line) {
    return TokenEstimator.estimateTokens(`${line}\n`);
  }

  constructor(budgetTokens) {
    this.remaining = budgetTokens;
  }

  select(root) {
    const plan = { admitted: new Set([root]), detailed: new Set(), hidden: new Map() };
    this.remaining -= OutlineBudget.cost(root.line());
    const order = this._admitBreadthFirst(root, plan);
    this._addDetails(order, plan);
    return plan;
  }

  _admitBreadthFirst(root, plan) {
    const order = [root];
    for (let i = 0; i < order.length; i++) order.push(...this._admitChildren(order[i], plan));
    return order;
  }

  _admitChildren(node, plan) {
    const total = node.childTotal;
    const moreReserve = OutlineBudget.cost(node.moreLine(total));
    let shown = 0;
    for (const child of node.children) {
      const cost = OutlineBudget.cost(child.line());
      const reserve = shown + 1 < total ? moreReserve : 0;
      if (cost + reserve > this.remaining) break;
      this.remaining -= cost;
      plan.admitted.add(child);
      shown++;
    }
    this._chargeCut(node, shown, total, plan);
    return node.children.slice(0, shown);
  }

  _chargeCut(node, shown, total, plan) {
    const hidden = total - shown;
    if (shown === 0 || hidden === 0) return;
    this.remaining -= OutlineBudget.cost(node.moreLine(hidden));
    plan.hidden.set(node, hidden);
  }

  _addDetails(order, plan) {
    for (const node of order) {
      if (!node.detail) continue;
      const extra = OutlineBudget.cost(node.line(true)) - OutlineBudget.cost(node.line());
      if (extra > this.remaining) continue;
      this.remaining -= extra;
      plan.detailed.add(node);
    }
  }
}

module.exports = OutlineBudget;
