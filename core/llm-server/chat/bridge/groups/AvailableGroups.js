const ToolGroups = require('../../ToolGroups');

class AvailableGroups {
  static KNOWLEDGE_BASE = 'knowledge_base';
  static DEFAULT_KB_SCOPE = 'kb';

  static for(allows, extTools, { kbHasDocs = true } = {}) {
    return [...ToolGroups.staticGroups(), ...ToolGroups.extGroupsFor(extTools)]
      .filter((g) => g.tools.some((t) => allows(t)))
      .filter((g) => kbHasDocs || g.key !== AvailableGroups.KNOWLEDGE_BASE);
  }

  static knowledgeBaseHasDocs(ragService, scope = AvailableGroups.DEFAULT_KB_SCOPE) {
    try {
      return !!(ragService && ragService.count && ragService.count(scope) > 0);
    } catch (_) {
      return false;
    }
  }
}

module.exports = AvailableGroups;
