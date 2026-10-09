const ThinkingFactsDeriver = require('./ThinkingFactsDeriver');
const ThinkingVocabulary = require('./ThinkingVocabulary');

class ThinkingFacts {
  static REGEX_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh'];

  static derive(renders, context = {}) {
    return new ThinkingFactsDeriver(renders, context).execute();
  }

  static fromRegex(template, templateHash = null) {
    const reads = typeof template === 'string' && /reasoning_effort/.test(template);
    return {
      source: 'regex',
      probeVersion: ThinkingVocabulary.PROBE_VERSION,
      templateHash,
      supportsThinkingToggle: null,
      toggleAffectsHistoryOnly: false,
      thinkingDefault: reads ? 'on' : 'none',
      thinkingFixed: false,
      effortLevels: reads ? ThinkingFacts.REGEX_EFFORT_LEVELS.slice() : [],
      effortDefault: null,
      effortDomain: reads ? 'assumed' : 'ignored',
      effortAliases: {},
      invalidPassesThrough: false,
      effortAffectsHistoryOnly: false,
      disableKwarg: null,
      shapes: {},
    };
  }

  static offersControl(facts) {
    if (!facts) return false;
    return !!(facts.supportsThinkingToggle || (facts.effortLevels && facts.effortLevels.length) || facts.disableKwarg);
  }
}

module.exports = ThinkingFacts;
