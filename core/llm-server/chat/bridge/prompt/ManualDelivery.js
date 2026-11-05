const ToolGroups = require('../../ToolGroups');

class ManualDelivery {
  static HEADER = '[Tool manuals loaded for this conversation. These groups are already active and stay active; '
    + 'do not call activate_tools for them again.]';

  static render(groups, keys, { nativeTools = false } = {}) {
    if (!groups || !Array.isArray(keys) || !keys.length) return '';
    const wanted = new Set(keys);
    const docs = (groups.available || [])
      .filter((g) => g && wanted.has(g.key) && g.doc)
      .map((g) => (nativeTools ? ToolGroups.docWithoutFenceExamples(g.doc) : g.doc));
    if (!docs.length) return '';
    return `${ManualDelivery.HEADER}\n\n${docs.join('\n\n')}\n\n`;
  }
}

module.exports = ManualDelivery;
