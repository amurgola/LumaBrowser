const FunctionSchema = require('./FunctionSchema');

class LazySchemaStubber {
  static dropInactive(fullSchemas, groups, registeredGroups) {
    if (!Array.isArray(groups) || groups.length === 0) return fullSchemas;
    const unregistered = LazySchemaStubber._unregisteredTools(groups, registeredGroups);
    if (unregistered.size === 0) return fullSchemas;
    return fullSchemas.filter((schema) => !unregistered.has(FunctionSchema.nameOf(schema)));
  }

  static _unregisteredTools(groups, registeredGroups) {
    const registered = registeredGroups instanceof Set ? registeredGroups : new Set(registeredGroups || []);
    const kept = new Set();
    const lazy = new Set();
    for (const group of groups) {
      if (!group) continue;
      for (const tool of (group.tools || [])) (registered.has(group.key) ? kept : lazy).add(tool);
    }
    return new Set([...lazy].filter((tool) => !kept.has(tool)));
  }
}

module.exports = LazySchemaStubber;
