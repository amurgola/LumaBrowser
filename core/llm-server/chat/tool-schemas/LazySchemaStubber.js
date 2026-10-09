const FunctionSchema = require('./FunctionSchema');

class LazySchemaStubber {
  static stubSchema(name, group) {
    const what = (group && group.stub) ? String(group.stub).replace(/\s+/g, ' ').trim() : 'Not loaded yet.';
    return FunctionSchema.build(name, `${what} NOT LOADED YET: call this with no arguments to load its instructions, `
      + 'then re-issue your real call with the arguments it describes.', {}, []);
  }

  static apply(fullSchemas, groups, activeGroups) {
    if (!Array.isArray(groups) || groups.length === 0) return fullSchemas;
    const inactive = LazySchemaStubber._inactiveToolOwners(groups, activeGroups);
    if (inactive.size === 0) return fullSchemas;
    return fullSchemas.map((schema) => {
      const name = FunctionSchema.nameOf(schema);
      return inactive.has(name) ? LazySchemaStubber.stubSchema(name, inactive.get(name)) : schema;
    });
  }

  static _inactiveToolOwners(groups, activeGroups) {
    const active = activeGroups instanceof Set ? activeGroups : new Set(activeGroups || []);
    const inactive = new Map();
    for (const group of groups) {
      if (!group || active.has(group.key)) continue;
      for (const tool of (group.tools || [])) inactive.set(tool, group);
    }
    return inactive;
  }
}

module.exports = LazySchemaStubber;
