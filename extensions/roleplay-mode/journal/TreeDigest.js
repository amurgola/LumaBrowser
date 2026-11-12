class TreeDigest {
  static TEXT_MAX = 70;

  static of(tree, data) {
    const d = data || {};
    const list = Array.isArray(tree) ? tree : [];
    const story = d.story && typeof d.story === 'object' ? d.story : {};
    const timeline = d.timeline && d.timeline.entries ? d.timeline.entries : {};
    const present = new Set(((d.currentState && d.currentState.characters) || []).filter((e) => e && e.present !== false).map((e) => e.charId || e.name));
    const scene = (Array.isArray(d.scenes) ? d.scenes : []).find((s) => s && s.id === ((d.currentState && d.currentState.sceneId) || d.activeSceneId));
    return {
      messages: list.map((m) => ({
        id: m.id, role: m.role, parentId: m.parentId || null, active: m.active !== false,
        text: TreeDigest._short(m.content),
      })),
      active: TreeDigest.shown(list),
      headId: d.headId || null,
      points: Object.keys(timeline),
      state: {
        turn: Number(story.turn) || 0,
        scene: scene ? scene.name : '',
        cast: (Array.isArray(d.characters) ? d.characters : []).filter((c) => c && c.name)
          .map((c) => c.name + (present.has(c.id) || present.has(c.name) ? '' : ' (off stage)')),
        ledger: (Array.isArray(story.ledger) ? story.ledger : []).filter((r) => r && r.text).map((r) => 'turn ' + r.turn + ': ' + r.text),
        threads: (Array.isArray(story.threads) ? story.threads : []).filter((t) => t && t.open && t.text).map((t) => t.text),
        pressure: String(story.pressure || ''),
        summaryChars: String(story.summary || '').length,
      },
    };
  }

  static shown(list) {
    const on = new Set();
    for (const m of list) {
      if (m.active === false) continue;
      if (!m.parentId || on.has(m.parentId)) on.add(m.id);
    }
    return list.filter((m) => on.has(m.id)).map((m) => m.id);
  }

  static diff(before, after) {
    if (!before || !after) return null;
    const ids = (digest) => new Set(digest.messages.map((m) => m.id));
    const was = ids(before);
    const now = ids(after);
    const out = {
      messagesAdded: after.messages.filter((m) => !was.has(m.id)),
      messagesRemoved: before.messages.filter((m) => !now.has(m.id)),
      branch: TreeDigest._fork(before.active, after.active),
      pointsDropped: before.points.filter((id) => !after.points.includes(id)),
      pointsAdded: after.points.filter((id) => !before.points.includes(id)),
      headWas: before.headId,
      headNow: after.headId,
      state: TreeDigest._state(before.state, after.state),
    };
    const quiet = !out.messagesAdded.length && !out.messagesRemoved.length && !out.branch && !out.pointsDropped.length
      && !out.pointsAdded.length && out.headWas === out.headNow && !Object.keys(out.state).length;
    return quiet ? null : out;
  }

  static _fork(was, now) {
    let at = 0;
    while (at < was.length && at < now.length && was[at] === now[at]) at += 1;
    if (at >= was.length) return null;
    return { at, was: was.slice(at), now: now.slice(at) };
  }

  static _state(was, now) {
    const out = {};
    for (const key of ['turn', 'scene', 'pressure', 'summaryChars']) {
      if (was[key] !== now[key]) out[key] = { was: was[key], now: now[key] };
    }
    for (const key of ['cast', 'ledger', 'threads']) {
      const removed = was[key].filter((x) => !now[key].includes(x));
      const added = now[key].filter((x) => !was[key].includes(x));
      if (removed.length || added.length) out[key] = { removed, added };
    }
    return out;
  }

  static _short(text) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    return s.length > TreeDigest.TEXT_MAX ? s.slice(0, TreeDigest.TEXT_MAX) + '…' : s;
  }
}

module.exports = TreeDigest;
