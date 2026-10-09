class MessageTree {
  static activePath(rows) {
    if (rows.length > 1 && rows.every((r) => !r.parent_id)) return rows.filter((r) => r.variant_active !== 0);
    const kids = MessageTree._children(rows);
    const path = [];
    const seen = new Set();
    let cur = MessageTree._pick(kids.get(null));
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      path.push(cur);
      cur = MessageTree._pick(kids.get(cur.id));
    }
    return path;
  }

  static leafId(rows) {
    const path = MessageTree.activePath(rows);
    return path.length ? path[path.length - 1].id : null;
  }

  static legacyParents(rows) {
    const parents = new Map();
    const groupParent = new Map();
    let lastActive = null;
    for (const r of rows) {
      let parent;
      if (r.variant_group && groupParent.has(r.variant_group)) {
        parent = groupParent.get(r.variant_group);
      } else {
        parent = lastActive;
        if (r.variant_group) groupParent.set(r.variant_group, parent);
      }
      parents.set(r.id, parent);
      if (r.variant_active !== 0) lastActive = r.id;
    }
    return parents;
  }

  static _children(rows) {
    const ids = new Set(rows.map((r) => r.id));
    const kids = new Map();
    for (const r of rows) {
      const key = r.parent_id && ids.has(r.parent_id) ? r.parent_id : null;
      if (!kids.has(key)) kids.set(key, []);
      kids.get(key).push(r);
    }
    return kids;
  }

  static _pick(list) {
    if (!list || !list.length) return null;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].variant_active !== 0) return list[i];
    }
    return list[list.length - 1];
  }
}

module.exports = MessageTree;
