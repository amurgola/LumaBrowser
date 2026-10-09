const CudaDeviceProbe = require('./CudaDeviceProbe');
const PlacementLayout = require('./PlacementLayout');
const PlacementStore = require('./placement/PlacementStore');
const PlacementResolver = require('./placement/PlacementResolver');
const VramLedger = require('./vram/VramLedger');
const VramOverride = require('./vram/VramOverride');
const AutoVramPlacement = require('./vram/AutoVramPlacement');
const StateChangeHook = require('./vram/StateChangeHook');

class VramCoordinator {
  static shared = new VramCoordinator();

  constructor() {
    this._ledger = new VramLedger();
    this._clock = 0;
  }

  reserve({ serverId, role, requiredBytes, allowSplit = true, settingsDb, diagnostics } = {}) {
    if (!serverId) throw new Error('VramCoordinator.reserve: serverId is required');
    const request = { serverId, role, requiredBytes, allowSplit, settingsDb, diagnostics, ts: ++this._clock };
    return this._reserveFromLayout(request)
      || this._reserveFromOverride(request)
      || this._reserveAutomatically(request);
  }

  hold(serverId, { devices, bytes, role = 'llm' } = {}) {
    if (!serverId) throw new Error('VramCoordinator.hold: serverId is required');
    const indexes = (Array.isArray(devices) ? devices : [])
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 0);
    this._record(serverId, { devices: indexes, bytes: Number(bytes) > 0 ? Number(bytes) : 0, offloadToCpu: false, role, ts: ++this._clock });
  }

  release(serverId) {
    if (serverId) this._ledger.delete(serverId);
  }

  setSplit(serverId, ratios) {
    const claim = this._ledger.get(serverId);
    if (!claim || !Array.isArray(ratios) || ratios.length !== claim.devices.length) return false;
    const nums = ratios.map((x) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : 0));
    const total = nums.reduce((a, b) => a + b, 0);
    if (!(total > 0)) return false;
    claim.weights = nums.map((x) => x / total);
    return true;
  }

  debitedDevices(diagnostics, { excludeServerId } = {}) {
    const devices = CudaDeviceProbe.readDevices(diagnostics) || [];
    return VramLedger.applyDebit(devices, this._ledger.debitMap(excludeServerId));
  }

  markResidentOnReady(emitter, serverId) {
    return StateChangeHook.on(emitter, (e) => {
      const claim = this._ledger.get(serverId);
      if (!claim || !e) return;
      if (e.state === 'ready') claim.resident = true;
      else if (e.state === 'starting' || e.state === 'loading') claim.resident = false;
    });
  }

  releaseOnIdle(emitter, serverId) {
    return StateChangeHook.on(emitter, (e) => {
      if (!e || (e.state !== 'idle' && e.state !== 'error')) return;
      try { this.release(serverId); } catch (_) {}
    });
  }

  snapshot() {
    return this._ledger.snapshot();
  }

  _reserveFromLayout({ serverId, role, requiredBytes, allowSplit, settingsDb, diagnostics, ts }) {
    const placed = this._layoutPlacement(serverId, requiredBytes, allowSplit, settingsDb, diagnostics);
    if (!placed) return null;
    this._record(serverId, {
      devices: placed.devices,
      bytes: VramCoordinator._claimBytes(placed.offloadToCpu, requiredBytes),
      offloadToCpu: !!placed.offloadToCpu, role, ts,
    });
    return placed;
  }

  _layoutPlacement(serverId, requiredBytes, allowSplit, settingsDb, diagnostics) {
    try {
      if (!settingsDb || !settingsDb.get) return null;
      return PlacementResolver.resolve(PlacementStore.load(settingsDb), serverId, {
        diagnostics,
        requiredBytes,
        allowSplit,
        devices: this.debitedDevices(diagnostics, { excludeServerId: serverId }),
      });
    } catch (_) {
      return null;
    }
  }

  _reserveFromOverride({ serverId, role, requiredBytes, settingsDb, ts }) {
    const override = VramOverride.read(settingsDb, role);
    if (override === undefined) return null;
    if (override === '') {
      this._record(serverId, { devices: [], bytes: 0, offloadToCpu: false, role, ts });
      return VramCoordinator._unpinned();
    }
    const devices = VramOverride.devices(override);
    this._record(serverId, { devices, bytes: Number(requiredBytes) || 0, offloadToCpu: false, role, ts });
    return { cudaDevice: override, offloadToCpu: false, devices, split: null };
  }

  _reserveAutomatically({ serverId, role, requiredBytes, allowSplit, diagnostics, ts }) {
    const all = CudaDeviceProbe.readDevices(diagnostics);
    if (!all || all.length < 2) {
      this._record(serverId, { devices: all ? all.map((d) => d.index) : [], bytes: Number(requiredBytes) || 0, offloadToCpu: false, role, ts });
      return VramCoordinator._unpinned();
    }
    const debited = VramLedger.applyDebit(all, this._ledger.debitMap(serverId));
    const placed = AutoVramPlacement.place(debited, { requiredBytes, allowSplit });
    const need = Number(requiredBytes) > 0 ? Number(requiredBytes) : 0;
    this._record(serverId, { devices: placed.devices, bytes: VramCoordinator._claimBytes(placed.offloadToCpu, need), offloadToCpu: placed.offloadToCpu, role, ts });
    return {
      cudaDevice: AutoVramPlacement.cudaDeviceFor(placed, all.length),
      offloadToCpu: placed.offloadToCpu,
      devices: placed.devices,
      split: null,
    };
  }

  _record(serverId, claim) {
    this._ledger.set(serverId, claim);
  }

  static _claimBytes(offloadToCpu, requiredBytes) {
    return offloadToCpu ? PlacementLayout.OFFLOAD_RESIDENT_BYTES : (Number(requiredBytes) || 0);
  }

  static _unpinned() {
    return { cudaDevice: null, offloadToCpu: false, devices: [], split: null };
  }
}

module.exports = VramCoordinator;
