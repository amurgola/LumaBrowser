const PlacementLayout = require('../PlacementLayout');

class PlacementStore {
  static LEGACY_KEYS = {
    mode: 'core.placement.mode',
    plan: 'core.placement.plan',
    hotswapCard: 'core.placement.hotswapCard',
    hotswapScope: 'core.placement.hotswapScope',
    autoStart: 'core.placement.autoStart',
    autoStopMs: 'core.placement.autoStopMs',
  };

  static load(settingsDb) {
    if (!settingsDb || !settingsDb.get) return PlacementLayout.emptyLayout();
    const raw = PlacementStore._readStored(settingsDb);
    if (raw && typeof raw === 'object') return PlacementLayout.normalizeLayout(raw);
    return PlacementStore.migrateLegacy(settingsDb);
  }

  static save(settingsDb, layout) {
    const norm = PlacementLayout.normalizeLayout(layout);
    try { settingsDb.set(PlacementLayout.LAYOUT_KEY, JSON.stringify(norm)); } catch (_) {}
    return norm;
  }

  static migrateLegacy(settingsDb) {
    const layout = PlacementLayout.emptyLayout();
    try {
      PlacementStore._carryAutoStartStop(settingsDb, layout);
      const mode = String(settingsDb.get(PlacementStore.LEGACY_KEYS.mode, 'auto'));
      if (mode === 'manual') PlacementStore._migrateManual(settingsDb, layout);
      else if (mode === 'hotswap') PlacementStore._migrateHotswap(settingsDb, layout);
    } catch (_) {}
    return PlacementLayout.normalizeLayout(layout);
  }

  static _readStored(settingsDb) {
    try {
      const raw = settingsDb.get(PlacementLayout.LAYOUT_KEY, null);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {
      return null;
    }
  }

  static _carryAutoStartStop(settingsDb, layout) {
    layout.autoStart = !!settingsDb.get(PlacementStore.LEGACY_KEYS.autoStart, false);
    const autoStopMs = settingsDb.get(PlacementStore.LEGACY_KEYS.autoStopMs, null);
    if (autoStopMs != null && Number.isFinite(Number(autoStopMs))) {
      layout.autoStopMs = Math.max(0, Math.floor(Number(autoStopMs)));
    }
  }

  static _migrateManual(settingsDb, layout) {
    const plan = PlacementStore._readPlan(settingsDb);
    for (const item of PlacementLayout.ITEM_KEYS) {
      const placement = PlacementStore._manualPlacement(layout, plan && plan[item]);
      if (placement) layout.items[item] = placement;
    }
  }

  static _readPlan(settingsDb) {
    const plan = settingsDb.get(PlacementStore.LEGACY_KEYS.plan, null);
    if (typeof plan !== 'string') return plan;
    try { return JSON.parse(plan); } catch (_) { return null; }
  }

  static _manualPlacement(layout, entry) {
    if (!entry) return null;
    if (entry.target === 'ram') return { resource: PlacementLayout.RAM_ID, split: null };
    const devices = Array.isArray(entry.devices) ? entry.devices.map((n) => Number(n)).filter(Number.isInteger) : [];
    if (!devices.length) return null;
    const split = Array.isArray(entry.split) && entry.split.length === devices.length ? entry.split.map(Number) : null;
    return { resource: PlacementStore._ensureResource(layout, devices), split: split && split.length > 1 ? split : null };
  }

  static _ensureResource(layout, devices) {
    const single = devices.length === 1;
    const id = single ? PlacementLayout.gpuResourceId(devices[0]) : `grp_${devices.join('_')}`;
    if (!layout.resources.some((r) => r.id === id)) {
      layout.resources.push({ id, kind: single ? 'gpu' : 'gpu-group', devices: devices.slice() });
    }
    return id;
  }

  static _migrateHotswap(settingsDb, layout) {
    const rawCard = settingsDb.get(PlacementStore.LEGACY_KEYS.hotswapCard, null);
    const card = (rawCard === null || rawCard === undefined || rawCard === '') ? null : Number(rawCard);
    if (!Number.isInteger(card)) return;
    const scope = String(settingsDb.get(PlacementStore.LEGACY_KEYS.hotswapScope, 'images')) === 'all' ? 'all' : 'images';
    const members = scope === 'all' ? ['llm', 'imageGenerate', 'imageEdit'] : ['imageGenerate', 'imageEdit'];
    PlacementLayout.addSingularity(layout, card, members, 's_migrated');
  }
}

module.exports = PlacementStore;
