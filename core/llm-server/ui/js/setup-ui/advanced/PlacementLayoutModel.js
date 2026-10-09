import PlacementItems from './PlacementItems.js';
import RemoteRefs from './RemoteRefs.js';

export default class PlacementLayoutModel {
  static REMOTE_REFUSAL = 'Remote GPUs can only run the LLM for now. Image and video models stay on local cards.';

  constructor() {
    this.config = null;
    this.layout = PlacementItems.emptyLayout();
    this.snapshot = PlacementLayoutModel.emptySnapshot();
    this.measured = {};
    this.canApply = false;
    this.splitEditor = null;
    this.combineOpen = false;
    this._singularitySeq = 0;
  }

  static emptySnapshot() {
    return { devices: [], remoteDevices: [], servers: {} };
  }

  applyConfig(config) {
    this.config = config || {};
    this.layout = (config && config.layout) || PlacementItems.emptyLayout();
    if (!this.layout.items[PlacementItems.CONTEXT_KEY]) this.layout.items[PlacementItems.CONTEXT_KEY] = PlacementItems.defaultContext();
    this.measured = (config && config.measuredCurrent) || {};
    this.canApply = !!(config && config.canApply);
  }

  setSnapshot(snapshot) {
    this.snapshot = snapshot || PlacementLayoutModel.emptySnapshot();
  }

  resource(id) {
    return (this.layout.resources || []).find((r) => r.id === id) || null;
  }

  singularity(id) {
    return (this.layout.singularities || []).find((s) => s.id === id) || null;
  }

  singularityFor(itemKey) {
    return (this.layout.singularities || []).find((s) => s.members.includes(itemKey)) || null;
  }

  effectiveResourceId(itemKey) {
    const sing = this.singularityFor(itemKey);
    if (sing) return sing.resource || null;
    const entry = this.layout.items[itemKey];
    return entry ? entry.resource : null;
  }

  context() {
    return this.layout.items[PlacementItems.CONTEXT_KEY];
  }

  device(index) {
    return (this.snapshot.devices || []).find((d) => d.index === index) || null;
  }

  ensureGpuResources() {
    for (const dev of (this.snapshot.devices || [])) this._ensureResource('g' + dev.index, [dev.index]);
    for (const rd of (this.snapshot.remoteDevices || [])) this._ensureResource(rd.ref, [rd.ref]);
  }

  groupedDevices() {
    const set = new Set();
    for (const r of this.layout.resources) {
      if (r.kind === 'gpu-group') for (const d of r.devices) set.add(d);
    }
    return set;
  }

  itemAvailable(key) {
    const srv = this.snapshot && this.snapshot.servers && this.snapshot.servers[key];
    if (!srv || srv.available !== false) return true;
    return !!(this.layout.items[key] && this.layout.items[key].resource) || !!this.singularityFor(key);
  }

  place(itemKey, target) {
    if (itemKey === PlacementItems.CONTEXT_KEY) { this._placeContext(target); return null; }
    if (itemKey !== 'llm' && target.kind === 'resource' && RemoteRefs.resourceHasRemote(this.resource(target.id))) {
      return PlacementLayoutModel.REMOTE_REFUSAL;
    }
    this._detach(itemKey);
    if (target.kind === 'resource') this.layout.items[itemKey] = { resource: target.id, split: null };
    else if (target.kind === 'singularity') this._joinSingularity(itemKey, target.id);
    this._dropEmptySingularities();
    return null;
  }

  setContextSplit(enabled) {
    const ctx = this.context() || PlacementItems.defaultContext();
    this.layout.items[PlacementItems.CONTEXT_KEY] = { enabled: !!enabled, location: ctx.location || 'vram' };
  }

  ensureGroup(devices) {
    const id = 'grp_' + devices.join('_');
    if (!this.layout.resources.some((r) => r.id === id)) {
      this.layout.resources.push({ id, kind: 'gpu-group', devices: devices.slice() });
    }
    return id;
  }

  ungroup(resId) {
    for (const it of PlacementItems.ITEMS) {
      const entry = this.layout.items[it.key];
      if (entry && entry.resource === resId) this.layout.items[it.key] = null;
    }
    this.layout.singularities = this.layout.singularities.filter((s) => s.resource !== resId);
    this.layout.resources = this.layout.resources.filter((r) => r.id !== resId);
  }

  reorderGroup(resId, from, to) {
    const r = this.resource(resId);
    if (!r || to < 0 || to >= r.devices.length) return false;
    const [moved] = r.devices.splice(from, 1);
    r.devices.splice(to, 0, moved);
    return true;
  }

  addSingularity(resId) {
    this._singularitySeq += 1;
    this.layout.singularities.push({ id: 's' + this._singularitySeq, members: [], resource: resId });
  }

  removeSingularity(id) {
    this.layout.singularities = this.layout.singularities.filter((s) => s.id !== id);
  }

  detachLlmFromSingularities() {
    for (const s of this.layout.singularities) s.members = s.members.filter((m) => m !== 'llm');
    this._dropEmptySingularities();
  }

  _placeContext(target) {
    const ctx = this.context();
    if (!ctx || !ctx.enabled) return;
    if (target.kind === 'resource') {
      const r = this.resource(target.id);
      ctx.location = (r && r.kind === 'ram') ? 'ram' : 'vram';
    } else {
      ctx.location = 'vram';
    }
  }

  _detach(itemKey) {
    for (const s of this.layout.singularities) s.members = s.members.filter((m) => m !== itemKey);
    this.layout.items[itemKey] = null;
  }

  _joinSingularity(itemKey, singularityId) {
    const s = this.singularity(singularityId);
    if (s && !s.members.includes(itemKey)) s.members.push(itemKey);
  }

  _dropEmptySingularities() {
    this.layout.singularities = this.layout.singularities.filter((s) => s.members.length > 0);
  }

  _ensureResource(id, devices) {
    if (!this.layout.resources.some((r) => r.id === id)) this.layout.resources.push({ id, kind: 'gpu', devices });
  }
}
