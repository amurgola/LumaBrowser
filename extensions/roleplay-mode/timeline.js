(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RP_TIMELINE = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = 1;
  const CHAR_ASSETS = ['art', 'figure', 'avatar', 'outfits'];
  const SCENE_ASSETS = ['bg'];
  const CHAR_DEFINITION = ['name', 'description', 'appearance', 'profile', 'seed'];
  const SCENE_DEFINITION = ['name', 'description'];
  const SERVER_KEYS = ['pendingArtAudit', 'assetRetry'];
  const CHANGES_MAX = 24;
  const CHANGE_TEXT_MAX = 200;

  function list(v) { return Array.isArray(v) ? v : []; }

  function clone(v) {
    if (v === undefined || v === null || typeof v !== 'object') return v === undefined ? null : v;
    return JSON.parse(JSON.stringify(v));
  }

  function without(row, keys) {
    const out = {};
    for (const k of Object.keys(row || {})) if (!keys.includes(k)) out[k] = row[k];
    return out;
  }

  function only(row, keys) {
    const out = {};
    for (const k of keys) if (row && Object.prototype.hasOwnProperty.call(row, k) && row[k] !== undefined) out[k] = row[k];
    return out;
  }

  function byId(rows) {
    const map = {};
    for (const r of list(rows)) if (r && r.id) map[r.id] = r;
    return map;
  }

  function snapshot(data) {
    const d = data || {};
    return {
      characters: list(d.characters).filter(Boolean).map((c) => clone(without(c, CHAR_ASSETS))),
      scenes: list(d.scenes).filter(Boolean).map((s) => clone(without(s, SCENE_ASSETS))),
      activeSceneId: d.activeSceneId || null,
      currentState: clone(d.currentState),
      story: clone(d.story),
      lastRender: clone(d.lastRender),
    };
  }

  function isTimeline(t) {
    return !!(t && typeof t === 'object' && t.v === VERSION && t.base && t.entries && typeof t.entries === 'object'
      && t.vault && t.vault.characters && t.vault.scenes);
  }

  function ensure(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.headId === undefined) data.headId = null;
    if (isTimeline(data.timeline)) return false;
    data.timeline = { v: VERSION, base: snapshot(data), entries: {}, vault: { characters: {}, scenes: {} } };
    return true;
  }

  function reset(data) {
    if (!data || typeof data !== 'object') return;
    data.timeline = null;
    data.headId = null;
    ensure(data);
  }

  function commit(data, messageId, opts) {
    ensure(data);
    const t = data.timeline;
    const snap = snapshot(data);
    if (!messageId) {
      t.base = snap;
      data.headId = null;
      return;
    }
    const prev = t.entries[messageId] || {};
    const activity = opts && opts.activity !== undefined ? opts.activity : (prev.activity || null);
    t.entries = Object.assign({}, t.entries, {
      [messageId]: { at: prev.at || Date.now(), turn: (snap.story && Number(snap.story.turn)) || 0, state: snap, activity },
    });
    data.headId = messageId;
  }

  function resolve(data, pathIds) {
    ensure(data);
    const t = data.timeline;
    const ids = list(pathIds);
    for (let i = ids.length - 1; i >= 0; i -= 1) {
      const e = t.entries[ids[i]];
      if (e && e.state) return { headId: ids[i], state: e.state };
    }
    return { headId: null, state: t.base };
  }

  function entry(data, messageId) {
    const t = data && data.timeline;
    return (isTimeline(t) && messageId && t.entries[messageId]) || null;
  }

  function park(data) {
    const vault = data.timeline.vault;
    vault.characters = Object.assign({}, vault.characters);
    vault.scenes = Object.assign({}, vault.scenes);
    const put = (map, row, keys) => {
      const assets = only(row, keys);
      if (row && row.id && Object.keys(assets).length) map[row.id] = Object.assign({}, map[row.id], assets);
    };
    for (const c of list(data.characters)) put(vault.characters, c, CHAR_ASSETS);
    for (const s of list(data.scenes)) put(vault.scenes, s, SCENE_ASSETS);
  }

  function unpark(data) {
    const vault = data.timeline.vault;
    for (const c of list(data.characters)) {
      if (!c || !c.id || !vault.characters[c.id]) continue;
      for (const [k, v] of Object.entries(vault.characters[c.id])) if (c[k] === undefined) c[k] = v;
      delete vault.characters[c.id];
    }
    for (const s of list(data.scenes)) {
      if (!s || !s.id || !vault.scenes[s.id]) continue;
      for (const [k, v] of Object.entries(vault.scenes[s.id])) if (s[k] === undefined) s[k] = v;
      delete vault.scenes[s.id];
    }
  }

  function shotOnPath(data, ids) {
    const images = (data && data.images) || {};
    for (let i = ids.length - 1; i >= 0; i -= 1) {
      const img = images[ids[i]];
      if (img && img.b64) {
        return { b64: img.b64, mime: img.mime || 'image/png', sceneId: (img.gen && img.gen.sceneId) || null, messageId: ids[i] };
      }
    }
    return null;
  }

  function scrub(data, onPath) {
    const keep = (r) => r && (!r.messageId || onPath.has(r.messageId));
    if (data.story && Array.isArray(data.story.ledger)) data.story.ledger = data.story.ledger.filter(keep);
    for (const c of list(data.characters)) {
      if (c && c.chronicle && Array.isArray(c.chronicle.beats)) c.chronicle.beats = c.chronicle.beats.filter(keep);
    }
  }

  function headKey(data) {
    return JSON.stringify([data.headId || null, snapshot(data)]);
  }

  function materialize(data, pathIds) {
    if (!data || typeof data !== 'object') return false;
    ensure(data);
    const ids = list(pathIds);
    const before = headKey(data);
    const { headId, state } = resolve(data, ids);
    park(data);
    data.characters = list(state.characters).map((n) => clone(n));
    data.scenes = list(state.scenes).map((n) => clone(n));
    unpark(data);
    data.activeSceneId = state.activeSceneId || null;
    data.currentState = clone(state.currentState) || { sceneId: data.activeSceneId, characters: [] };
    data.story = clone(state.story);
    const onPath = new Set(ids);
    data.lastRender = state.lastRender && onPath.has(state.lastRender.messageId) ? clone(state.lastRender) : null;
    data.lastShot = shotOnPath(data, ids);
    data.headId = headId;
    scrub(data, onPath);
    return before !== headKey(data);
  }

  function forget(data, messageId) {
    if (!data || !isTimeline(data.timeline) || !messageId || !data.timeline.entries[messageId]) return false;
    const entries = Object.assign({}, data.timeline.entries);
    delete entries[messageId];
    data.timeline.entries = entries;
    return true;
  }

  function eachSnapshot(t, fn) {
    t.base = fn(t.base);
    const entries = {};
    for (const [id, e] of Object.entries(t.entries)) entries[id] = Object.assign({}, e, { state: fn(e.state) });
    t.entries = entries;
  }

  function syncRows(rows, head, prevIds, defKeys, assetKeys, fresh) {
    const headById = byId(head);
    const headIds = new Set(Object.keys(headById));
    const removed = new Set(Array.from(prevIds).filter((id) => !headIds.has(id)));
    const out = list(rows).filter((r) => !(r && r.id && removed.has(r.id)))
      .map((r) => (r && r.id && headById[r.id] ? Object.assign({}, r, clone(only(headById[r.id], defKeys))) : r));
    const have = new Set(out.map((r) => r && r.id));
    for (const h of list(head)) {
      if (h && h.id && !prevIds.has(h.id) && !have.has(h.id)) out.push(fresh(clone(without(h, assetKeys))));
    }
    return { rows: out, removed };
  }

  function syncDefinitions(data, prev) {
    ensure(data);
    const t = data.timeline;
    const prevChars = new Set(list(prev && prev.characters).map((c) => c && c.id).filter(Boolean));
    const prevScenes = new Set(list(prev && prev.scenes).map((s) => s && s.id).filter(Boolean));
    const freshChar = (c) => Object.assign(c, { state: { present: false }, chronicle: { arc: '', beats: [] } });
    let removedChars = new Set();
    let removedScenes = new Set();
    eachSnapshot(t, (snap) => {
      if (!snap) return snap;
      const chars = syncRows(snap.characters, data.characters, prevChars, CHAR_DEFINITION, CHAR_ASSETS, freshChar);
      const scenes = syncRows(snap.scenes, data.scenes, prevScenes, SCENE_DEFINITION, SCENE_ASSETS, (s) => s);
      removedChars = chars.removed;
      removedScenes = scenes.removed;
      return Object.assign({}, snap, { characters: chars.rows, scenes: scenes.rows });
    });
    const vault = { characters: Object.assign({}, t.vault.characters), scenes: Object.assign({}, t.vault.scenes) };
    for (const id of removedChars) delete vault.characters[id];
    for (const id of removedScenes) delete vault.scenes[id];
    t.vault = vault;
  }

  function assetPool(data) {
    const t = data.timeline;
    const pool = { characters: Object.assign({}, t.vault.characters), scenes: Object.assign({}, t.vault.scenes) };
    const put = (map, row, keys) => {
      const assets = only(row, keys);
      if (row && row.id && Object.keys(assets).length) map[row.id] = Object.assign({}, map[row.id], assets);
    };
    for (const c of list(data.characters)) put(pool.characters, c, CHAR_ASSETS);
    for (const s of list(data.scenes)) put(pool.scenes, s, SCENE_ASSETS);
    return pool;
  }

  function mergeById(a, b) {
    const out = list(a).slice();
    for (const item of list(b)) {
      const i = item && item.id ? out.findIndex((x) => x && x.id === item.id) : -1;
      if (i >= 0) out[i] = item; else out.push(item);
    }
    return out;
  }

  function mergeAssets(a, b) {
    if (!a) return b;
    if (!b) return a;
    const out = Object.assign({}, a, b);
    if (a.outfits || b.outfits) out.outfits = mergeById(a.outfits, b.outfits);
    if ((a.art && typeof a.art === 'object') || (b.art && typeof b.art === 'object')) {
      const art = Object.assign({}, a.art || {}, b.art || {});
      const figs = Object.assign({}, (a.art && a.art.figures) || {}, (b.art && b.art.figures) || {});
      if (Object.keys(figs).length) art.figures = figs;
      out.art = b.art === null ? null : art;
    }
    return out;
  }

  function mergeForSave(latest, ours, opts) {
    const o = opts || {};
    const out = Object.assign({}, latest && typeof latest === 'object' ? latest : {});
    ensure(out);
    ensure(ours);
    for (const k of SERVER_KEYS) if (ours[k] !== undefined) out[k] = ours[k];
    out.images = Object.assign({}, out.images || {});
    if (o.ownId && ours.images && ours.images[o.ownId]) out.images[o.ownId] = ours.images[o.ownId];
    const entries = Object.assign({}, out.timeline.entries);
    if (o.ownId && ours.timeline.entries[o.ownId]) entries[o.ownId] = ours.timeline.entries[o.ownId];
    if (o.liveIds) for (const id of Object.keys(entries)) if (!o.liveIds.has(id)) delete entries[id];
    const pool = assetPool(out);
    const theirs = assetPool(ours);
    for (const kind of ['characters', 'scenes']) {
      for (const [id, assets] of Object.entries(theirs[kind])) pool[kind][id] = mergeAssets(pool[kind][id], assets);
    }
    out.timeline = { v: VERSION, base: out.timeline.base, entries, vault: pool };
    out.characters = list(out.characters).map((c) => without(c, CHAR_ASSETS));
    out.scenes = list(out.scenes).map((s) => without(s, SCENE_ASSETS));
    materialize(out, Array.isArray(o.activeIds) ? o.activeIds : (o.ownId ? [o.ownId] : []));
    return out;
  }

  function adoptHead(data, p) {
    if (!data || !p) return;
    ensure(data);
    park(data);
    if (Array.isArray(p.characters)) data.characters = p.characters;
    if (Array.isArray(p.scenes)) data.scenes = p.scenes;
    unpark(data);
    if (p.activeSceneId !== undefined) data.activeSceneId = p.activeSceneId;
    if (p.currentState !== undefined) data.currentState = p.currentState;
    if (p.story !== undefined) data.story = p.story;
    if (p.headId !== undefined) data.headId = p.headId;
    if (p.timelineEntry && p.timelineEntry.id && p.timelineEntry.entry) {
      data.timeline.entries = Object.assign({}, data.timeline.entries, { [p.timelineEntry.id]: p.timelineEntry.entry });
    }
  }

  function continuationIds(messages) {
    const path = list(messages).filter((m) => m && m.id);
    let end = -1;
    for (let i = path.length - 1; i >= 0; i -= 1) if (path[i].role === 'user') { end = i; break; }
    if (end < 0) end = path.length && path[path.length - 1].role === 'assistant' ? path.length - 1 : path.length;
    return path.slice(0, end).map((m) => m.id);
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  }

  function clockLine(c) {
    if (!c) return '';
    const bits = ['day ' + (Number(c.day) || 1)];
    if (c.timeOfDay) bits.push(c.timeOfDay);
    if (c.weather) bits.push(c.weather);
    return bits.join(', ');
  }

  function changes(before, after) {
    const out = [];
    const add = (kind, text) => {
      const t = String(text || '').trim();
      if (t && out.length < CHANGES_MAX) out.push({ kind, text: t.slice(0, CHANGE_TEXT_MAX) });
    };
    const b = before || {};
    const a = after || {};
    const was = byId(b.characters);
    const wasScene = byId(b.scenes);
    const sceneName = (id) => ((list(a.scenes).find((s) => s && s.id === id) || {}).name || '');
    for (const c of list(a.characters)) if (c && c.id && !was[c.id]) add('cast', (c.name || 'Someone') + ' joined the story');
    for (const s of list(a.scenes)) if (s && s.id && !wasScene[s.id]) add('place', 'New place: ' + (s.name || 'unnamed'));
    if (a.activeSceneId && a.activeSceneId !== b.activeSceneId) add('place', 'Moved to ' + (sceneName(a.activeSceneId) || 'a new place'));
    const sa = a.story || {};
    const sb = b.story || {};
    const rowKey = (r) => [r.turn, r.kind, r.text].join('|');
    const seen = new Set(list(sb.ledger).filter(Boolean).map(rowKey));
    for (const r of list(sa.ledger)) if (r && r.text && !seen.has(rowKey(r))) add(r.kind || 'event', r.text);
    for (const c of list(a.characters)) {
      if (!c || !c.id) continue;
      const p = was[c.id];
      const name = c.name || 'Someone';
      const st = c.state || {};
      const pst = (p && p.state) || {};
      if (p && st.present && !pst.present) add('presence', name + ' arrived');
      if (p && !st.present && pst.present) add('presence', name + ' left' + (st.lastSeen && st.lastSeen.note ? ': ' + st.lastSeen.note : ''));
      if (st.present && st.emotion && st.emotion !== pst.emotion) add('mood', name + ' feels ' + st.emotion);
      if (c.currentOutfitDesc && c.currentOutfitDesc !== (p && p.currentOutfitDesc)) add('outfit', name + ' wears ' + c.currentOutfitDesc);
      if (st.condition && st.condition !== pst.condition) add('condition', name + ': ' + st.condition);
      if (st.bondUser && st.bondUser !== pst.bondUser) add('bond', name + ' toward you: ' + st.bondUser);
      const pr = c.profile || {};
      const ppr = (p && p.profile) || {};
      if (ppr.hides && !pr.hides) add('reveal', name + '\'s secret is out');
      else if (pr.history && !ppr.history) add('profile', name + ': backstory written');
      else if (p && JSON.stringify(pr) !== JSON.stringify(ppr)) add('profile', name + ': character notes updated');
    }
    if (sa.clock && JSON.stringify(sa.clock) !== JSON.stringify(sb.clock || null)) add('clock', 'Time: ' + clockLine(sa.clock));
    const threadsBefore = new Map(list(sb.threads).filter(Boolean).map((th) => [norm(th.text), th]));
    for (const th of list(sa.threads)) {
      if (!th || !th.text) continue;
      const old = threadsBefore.get(norm(th.text));
      if (th.open && !old) add('thread', 'New thread: ' + th.text);
      else if (!th.open && old && old.open) add('thread', 'Resolved: ' + th.text);
    }
    if (sa.summary && sa.summary !== sb.summary) add('memory', 'Story summary updated');
    if (sa.pressure && sa.pressure !== sb.pressure) add('pressure', 'Pressure: ' + sa.pressure);
    return out;
  }

  return {
    VERSION,
    CHAR_ASSETS,
    SCENE_ASSETS,
    snapshot,
    ensure,
    reset,
    commit,
    resolve,
    entry,
    materialize,
    forget,
    syncDefinitions,
    mergeForSave,
    adoptHead,
    continuationIds,
    changes,
  };
}));
