const CompatibilityGambit = require('./gambit/CompatibilityGambit');

class TestSuiteCatalog {
  constructor({ llmServerService, chatRouter, suites = null }) {
    this._suites = suites || [new CompatibilityGambit({ llmServerService, chatRouter })];
  }

  describe() {
    return this._suites.map((suite) => suite.describe());
  }

  pick(suiteIds) {
    const wanted = new Set(Array.isArray(suiteIds) ? suiteIds : []);
    return this._suites.filter((suite) => wanted.has(suite.id));
  }

  results() {
    return Object.fromEntries(this._suites.map((suite) => [suite.id, suite.results()]));
  }
}

module.exports = TestSuiteCatalog;
