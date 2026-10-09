class LoopFinding {
  constructor({ pattern, record, held, facts = {} }) {
    this.pattern = pattern;
    this.tool = record.name;
    this.step = record.step;
    this.held = held;
    this.facts = facts;
  }
}

module.exports = LoopFinding;
