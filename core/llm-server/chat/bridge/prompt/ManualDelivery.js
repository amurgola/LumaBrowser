const ToolGroups = require('../../ToolGroups');

class ManualDelivery {
  static HEADER = '[Tool manuals loaded for this conversation. These groups are already active and stay active; '
    + 'do not call activate_tools for them again.]';

  static render(groups, keys, { nativeTools = false } = {}) {
    if (!groups || !Array.isArray(keys) || !keys.length) return '';
    const wanted = new Set(keys);
    const docs = ManualDelivery._docs(groups, nativeTools).filter((d) => wanted.has(d.key)).map((d) => d.doc);
    if (!docs.length) return '';
    return `${ManualDelivery.HEADER}\n\n${docs.join('\n\n')}\n\n`;
  }

  static carriedKeys(groups, turns, { nativeTools = false } = {}) {
    const carried = new Set();
    const blocks = (Array.isArray(turns) ? turns : [])
      .filter((t) => t && t.role === 'user' && typeof t.content === 'string' && t.content.includes(ManualDelivery.HEADER))
      .map((t) => t.content);
    if (!blocks.length || !groups) return carried;
    for (const { key, doc } of ManualDelivery._docs(groups, nativeTools)) {
      if (blocks.some((text) => text.includes(doc))) carried.add(key);
    }
    return carried;
  }

  static carryOver(groups, keys, head, recent, { nativeTools = false } = {}) {
    if (!groups || !Array.isArray(keys) || !keys.length) return '';
    const textOf = (list) => (Array.isArray(list) ? list : []).map((m) => (m && typeof m.content === 'string' ? m.content : ''));
    const gone = textOf(head);
    const kept = textOf(recent);
    const lost = ManualDelivery._docs(groups, nativeTools)
      .filter((d) => keys.includes(d.key) && gone.some((t) => t.includes(d.doc)) && !kept.some((t) => t.includes(d.doc)))
      .map((d) => d.key);
    return ManualDelivery.render(groups, lost, { nativeTools }).trimEnd();
  }

  static _docs(groups, nativeTools) {
    return (groups.available || [])
      .filter((g) => g && g.doc)
      .map((g) => ({ key: g.key, doc: nativeTools ? ToolGroups.docWithoutFenceExamples(g.doc) : g.doc }));
  }
}

module.exports = ManualDelivery;
