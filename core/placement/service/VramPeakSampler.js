const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const BestEffort = require('./BestEffort');

class VramPeakSampler {
  static VRAM_INTERVAL_MS = 350;
  static RAM_INTERVAL_MS = 1500;
  static LIVE_STATES = ['ready', 'starting'];

  constructor({ servers, gpu, vram, rss }) {
    this._servers = servers;
    this._gpu = gpu;
    this._vram = vram;
    this._rss = rss;
    this._reset();
  }

  start() {
    this._reset();
    this._tick(true);
    this._timer = setInterval(() => BestEffort.read(() => this._tick(false)), VramPeakSampler.VRAM_INTERVAL_MS);
    this._ramTimer = setInterval(() => BestEffort.read(() => this._sampleRam()), VramPeakSampler.RAM_INTERVAL_MS);
    return this;
  }

  stop() {
    clearInterval(this._timer);
    clearInterval(this._ramTimer);
    BestEffort.read(() => this._tick(false));
    BestEffort.read(() => this._sampleRam());
    return this._summary();
  }

  _reset() {
    this._pidItem = {};
    this._pidVramPeak = {};
    this._pidRamPeak = {};
    this._devicePeak = {};
    this._soleOccupantPeak = Object.fromEntries(PlacementLayout.ITEM_KEYS.map((item) => [item, 0]));
    this._perProcessSeen = false;
  }

  _tick(isFirst) {
    this._recordPids();
    this._recordProcessVram();
    const usedByIndex = this._recordDevices(isFirst);
    this._recordSoleOccupants(usedByIndex);
  }

  _recordPids() {
    for (const item of PlacementLayout.ITEM_KEYS) {
      const pid = this._servers.pid(item);
      if (pid != null) this._pidItem[pid] = item;
    }
  }

  _recordProcessVram() {
    const apps = BestEffort.read(() => this._gpu.readComputeApps()) || {};
    for (const [pid, bytes] of Object.entries(apps)) {
      if (bytes > 0) this._perProcessSeen = true;
      this._pidVramPeak[pid] = Math.max(this._pidVramPeak[pid] || 0, bytes);
    }
  }

  _recordDevices(isFirst) {
    const usedByIndex = {};
    for (const card of BestEffort.read(() => this._gpu.readDevices(null)) || []) {
      if (card.totalBytes == null || card.freeBytes == null) continue;
      const used = Math.max(0, card.totalBytes - card.freeBytes);
      usedByIndex[card.index] = used;
      const peak = this._devicePeak[card.index] || {
        name: card.name, totalBytes: card.totalBytes, peakUsedBytes: 0, baselineUsedBytes: isFirst ? used : 0,
      };
      peak.peakUsedBytes = Math.max(peak.peakUsedBytes, used);
      this._devicePeak[card.index] = peak;
    }
    return usedByIndex;
  }

  _recordSoleOccupants(usedByIndex) {
    const ledger = BestEffort.read(() => this._vram.snapshot()) || {};
    const occupants = VramPeakSampler.occupantsPerCard(ledger);
    for (const item of PlacementLayout.ITEM_KEYS) {
      if (!this._isLive(item)) continue;
      const claim = ledger[PlacementLayout.ITEM_TO_SERVER[item]];
      const devices = claim && Array.isArray(claim.devices) ? claim.devices : [];
      let best = 0;
      for (const index of devices) {
        if ((occupants[index] || 0) <= 1 && usedByIndex[index] != null) best = Math.max(best, usedByIndex[index]);
      }
      if (best > 0) this._soleOccupantPeak[item] = Math.max(this._soleOccupantPeak[item], best);
    }
  }

  _isLive(item) {
    const server = this._servers.runtimeServer(item);
    if (!server) return false;
    const state = BestEffort.read(() => server.getStatus().state);
    return VramPeakSampler.LIVE_STATES.includes(state);
  }

  _sampleRam() {
    for (const pid of Object.keys(this._pidItem)) {
      const bytes = this._rss.rssBytesSync(Number(pid));
      if (bytes != null && bytes > 0) this._pidRamPeak[pid] = Math.max(this._pidRamPeak[pid] || 0, bytes);
    }
  }

  _summary() {
    const servers = {};
    for (const item of PlacementLayout.ITEM_KEYS) {
      servers[item] = {
        peakBytes: this._peakFor(item, this._pidVramPeak),
        peakRamBytes: this._peakFor(item, this._pidRamPeak),
        cardPeakBytes: this._soleOccupantPeak[item] > 0 ? this._soleOccupantPeak[item] : null,
      };
    }
    return { perProcessAvailable: this._perProcessSeen, servers, devices: this._devicesSummary() };
  }

  _peakFor(item, table) {
    let peak = null;
    for (const [pid, owner] of Object.entries(this._pidItem)) {
      if (owner === item && table[pid] != null) peak = Math.max(peak || 0, table[pid]);
    }
    return peak;
  }

  _devicesSummary() {
    return Object.keys(this._devicePeak)
      .map(Number).sort((a, b) => a - b)
      .map((index) => ({ index, ...this._devicePeak[index] }));
  }

  static occupantsPerCard(ledger) {
    const occupants = {};
    for (const serverId of Object.keys(ledger || {})) {
      for (const index of ((ledger[serverId] && ledger[serverId].devices) || [])) {
        occupants[index] = (occupants[index] || 0) + 1;
      }
    }
    return occupants;
  }
}

module.exports = VramPeakSampler;
