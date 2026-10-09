const RemoteDeviceRef = require('./placement/RemoteDeviceRef');

const GB = 1024 * 1024 * 1024;

class PlacementLayout {
  static LAYOUT_KEY = 'core.placement.layout';
  static RAM_ID = 'ram';
  static ITEM_KEYS = ['llm', 'imageGenerate', 'imageEdit', 'imageVideo', 'music', 'grounding'];
  static SERVER_TO_ITEM = {
    llm: 'llm', 'image-generate': 'imageGenerate', 'image-edit': 'imageEdit',
    'image-video': 'imageVideo', music: 'music', grounding: 'grounding',
  };
  static ITEM_TO_SERVER = {
    llm: 'llm', imageGenerate: 'image-generate', imageEdit: 'image-edit',
    imageVideo: 'image-video', music: 'music', grounding: 'grounding',
  };
  static DEFAULT_AUTO_STOP_MS = 15 * 60 * 1000;
  static OFFLOAD_RESIDENT_BYTES = 8 * GB;

  static gpuResourceId(card) {
    return `g${card}`;
  }

  static emptyLayout() {
    return {
      version: 2,
      resources: [PlacementLayout._ramResource()],
      singularities: [],
      items: { ...PlacementLayout._unplacedItems(), llmContext: { enabled: false, location: 'vram' } },
      autoStart: false,
      autoStopMs: PlacementLayout.DEFAULT_AUTO_STOP_MS,
    };
  }

  static addSingularity(layout, card, members, id) {
    const resId = PlacementLayout.gpuResourceId(card);
    if (!layout.resources.some((r) => r.id === resId)) {
      layout.resources.push({ id: resId, kind: 'gpu', devices: [card] });
    }
    layout.singularities.push({ id, members: members.slice(), resource: resId });
    return layout;
  }

  static singularityLayout(card, members = ['llm', 'imageGenerate'], id = 'auto-setup') {
    return PlacementLayout.addSingularity(PlacementLayout.emptyLayout(), card, members, id);
  }

  static normalizeLayout(raw) {
    if (!raw || typeof raw !== 'object') return PlacementLayout.emptyLayout();
    return {
      version: 2,
      resources: PlacementLayout._normalizeResources(raw.resources),
      singularities: PlacementLayout._normalizeSingularities(raw.singularities),
      items: PlacementLayout._normalizeItems(raw.items || {}),
      autoStart: !!raw.autoStart,
      autoStopMs: PlacementLayout._normalizeAutoStop(raw.autoStopMs),
    };
  }

  static resourceById(layout, resId) {
    if (!resId) return null;
    return (layout.resources || []).find((r) => r.id === resId) || null;
  }

  static singularityFor(layout, itemKey) {
    return (layout.singularities || []).find((s) => s.members.includes(itemKey)) || null;
  }

  static effectiveResourceId(layout, itemKey) {
    const sing = PlacementLayout.singularityFor(layout, itemKey);
    if (sing) return sing.resource || null;
    const item = layout.items && layout.items[itemKey];
    return item ? item.resource : null;
  }

  static orderedDevices(layout, resId) {
    const res = PlacementLayout.resourceById(layout, resId);
    if (!res) return null;
    if (res.kind === 'ram') return [];
    return res.devices.slice();
  }

  static placedItems(layout) {
    return PlacementLayout.ITEM_KEYS.filter((k) => PlacementLayout.effectiveResourceId(layout, k) != null);
  }

  static hotswapPools(layout) {
    const pools = [];
    for (const sing of (layout.singularities || [])) {
      const pool = PlacementLayout._poolFor(layout, sing);
      if (pool) pools.push(pool);
    }
    return pools;
  }

  static remoteRefsFor(layout, serverId) {
    const itemKey = PlacementLayout.SERVER_TO_ITEM[serverId];
    if (!itemKey) return [];
    const devices = PlacementLayout.orderedDevices(layout, PlacementLayout.effectiveResourceId(layout, itemKey));
    if (!devices) return [];
    return devices.filter(RemoteDeviceRef.isRef).map((d) => ({ ...RemoteDeviceRef.parse(d), ref: d }));
  }

  static _poolFor(layout, sing) {
    const members = sing.members.map((m) => PlacementLayout.ITEM_TO_SERVER[m]).filter(Boolean);
    if (members.length < 2) return null;
    const devices = PlacementLayout.orderedDevices(layout, sing.resource);
    if (devices == null || devices.length === 0) return null;
    const card = devices.find((d) => !RemoteDeviceRef.isRef(d));
    if (card == null) return null;
    return { id: sing.id, card, members };
  }

  static _ramResource() {
    return { id: PlacementLayout.RAM_ID, kind: 'ram', devices: [] };
  }

  static _unplacedItems() {
    return Object.fromEntries(PlacementLayout.ITEM_KEYS.map((k) => [k, null]));
  }

  static _normalizeResources(resources) {
    const list = Array.isArray(resources) ? resources.map(PlacementLayout._normalizeResource).filter(Boolean) : [];
    return [PlacementLayout._ramResource(), ...list.filter((r) => r.id !== PlacementLayout.RAM_ID)];
  }

  static _normalizeResource(r) {
    if (!r || typeof r !== 'object') return null;
    const id = String(r.id || '').trim();
    if (!id) return null;
    let kind = r.kind;
    if (kind !== 'ram' && kind !== 'gpu' && kind !== 'gpu-group') {
      kind = id === PlacementLayout.RAM_ID ? 'ram' : 'gpu';
    }
    const devices = kind === 'ram' ? [] : PlacementLayout._normalizeDevices(r.devices);
    if (kind === 'gpu-group' && devices.length < 2) kind = 'gpu';
    return { id, kind, devices };
  }

  static _normalizeDevices(devices) {
    if (!Array.isArray(devices)) return [];
    return devices
      .map((d) => (RemoteDeviceRef.isRef(d) ? String(d) : Number(d)))
      .filter((d) => RemoteDeviceRef.isRef(d) || Number.isInteger(d));
  }

  static _normalizeSingularities(singularities) {
    const out = [];
    const seen = new Set();
    if (!Array.isArray(singularities)) return out;
    singularities.forEach((s, i) => {
      if (!s || typeof s !== 'object') return;
      const members = (Array.isArray(s.members) ? s.members : [])
        .filter((m) => PlacementLayout.ITEM_KEYS.includes(m) && !seen.has(m));
      if (members.length < 1) return;
      members.forEach((m) => seen.add(m));
      out.push({ id: String(s.id || `s${i}`), members, resource: s.resource == null ? null : String(s.resource) });
    });
    return out;
  }

  static _normalizeItems(items) {
    const out = {};
    for (const key of PlacementLayout.ITEM_KEYS) out[key] = PlacementLayout._normalizeItemPlacement(items[key]);
    out.llmContext = PlacementLayout._normalizeContext(items.llmContext);
    return out;
  }

  static _normalizeItemPlacement(p) {
    if (!p || typeof p !== 'object') return null;
    const resource = p.resource == null ? null : String(p.resource);
    if (!resource) return null;
    const split = Array.isArray(p.split) && p.split.length > 1
      ? p.split.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
      : null;
    const out = { resource, split: split && split.length > 1 ? split : null };
    const cap = Number(p.vramCapBytes);
    if (Number.isFinite(cap) && cap > 0 && !out.split) out.vramCapBytes = Math.round(cap);
    return out;
  }

  static _normalizeContext(c) {
    return { enabled: !!(c && c.enabled), location: c && c.location === 'ram' ? 'ram' : 'vram' };
  }

  static _normalizeAutoStop(value) {
    const ms = Number(value);
    return Number.isFinite(ms) && ms >= 0 ? Math.floor(ms) : PlacementLayout.DEFAULT_AUTO_STOP_MS;
  }
}

module.exports = PlacementLayout;
