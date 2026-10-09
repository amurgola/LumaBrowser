class DomQuery {
  static async nodeId(dbg, tabId, selector) {
    await dbg.sendCommand(tabId, 'DOM.enable', {});
    const { root } = await dbg.sendCommand(tabId, 'DOM.getDocument', { depth: 0 });
    const res = await dbg.sendCommand(tabId, 'DOM.querySelector', { nodeId: root.nodeId, selector });
    return res && res.nodeId ? res.nodeId : 0;
  }

  static async exists(dbg, tabId, selector) {
    try {
      return !!(await DomQuery.nodeId(dbg, tabId, selector));
    } catch (_) {
      return false;
    }
  }

  static centerOf(boxModelResult) {
    const model = boxModelResult && boxModelResult.model;
    if (!model || !model.content) return null;
    const [x1, y1, , , x3, y3] = model.content;
    return { x: (x1 + x3) / 2, y: (y1 + y3) / 2 };
  }
}

module.exports = DomQuery;
