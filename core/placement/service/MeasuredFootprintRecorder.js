const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const BestEffort = require('./BestEffort');
const LlmKvBreakdown = require('./LlmKvBreakdown');
const VramPeakSampler = require('./VramPeakSampler');

class MeasuredFootprintRecorder {
  constructor({ servers, measuredStore, slotInfo, vram, clock = () => new Date().toISOString() }) {
    this._servers = servers;
    this._measuredStore = measuredStore;
    this._slotInfo = slotInfo;
    this._vram = vram;
    this._clock = clock;
  }

  record(summary) {
    if (!summary || !summary.servers) return {};
    this._setupRun(summary);
    const entries = {};
    for (const item of PlacementLayout.ITEM_KEYS) {
      const entry = this._entryFor(item, summary.servers[item]);
      if (entry) entries[entry.modelKey] = entry;
    }
    this._measuredStore.merge(entries);
    return entries;
  }

  _setupRun(summary) {
    this._summary = summary;
    this._ranAt = this._clock();
    this._slots = BestEffort.read(() => this._slotInfo.build()) || {};
    this._ledger = BestEffort.read(() => this._vram.snapshot()) || {};
    this._occupants = VramPeakSampler.occupantsPerCard(this._ledger);
    this._deviceById = {};
    for (const device of (summary.devices || [])) this._deviceById[device.index] = device;
  }

  _entryFor(item, sample) {
    if (!sample) return null;
    const modelKey = this._servers.modelKey(item);
    if (!modelKey) return null;
    const { peakVramBytes, vramApprox } = this._peakVram(item, sample);
    const entry = {
      kind: item,
      modelKey,
      peakVramBytes,
      peakRamBytes: sample.peakRamBytes != null ? sample.peakRamBytes : null,
      vramApprox,
      ranAt: this._ranAt,
    };
    if (item === 'llm' && peakVramBytes != null) this._addKvSplit(entry, peakVramBytes);
    return entry;
  }

  _peakVram(item, sample) {
    if (sample.peakBytes != null) return { peakVramBytes: sample.peakBytes, vramApprox: !this._summary.perProcessAvailable };
    const cardPeak = sample.cardPeakBytes != null ? sample.cardPeakBytes : this._attributedPeak(item);
    if (cardPeak != null) return { peakVramBytes: cardPeak, vramApprox: true };
    return { peakVramBytes: null, vramApprox: !this._summary.perProcessAvailable };
  }

  _attributedPeak(item) {
    let best = null;
    for (const index of this._devicesOf(item)) {
      const candidate = this._cardCandidate(index);
      if (candidate != null && candidate > 0) best = Math.max(best || 0, candidate);
    }
    if (best != null) return best;
    const claim = this._ledger[PlacementLayout.ITEM_TO_SERVER[item]];
    return claim && Number(claim.bytes) > 0 && !claim.offloadToCpu ? Number(claim.bytes) : null;
  }

  _cardCandidate(index) {
    const device = this._deviceById[index];
    if (!device) return null;
    if ((this._occupants[index] || 0) <= 1 && device.peakUsedBytes != null) return device.peakUsedBytes;
    if (device.baselineUsedBytes != null) return Math.max(0, (device.peakUsedBytes || 0) - device.baselineUsedBytes);
    return null;
  }

  _devicesOf(item) {
    const fromSlot = this._slots[item] && this._slots[item].devices;
    if (Array.isArray(fromSlot) && fromSlot.length) return fromSlot;
    const claim = this._ledger[PlacementLayout.ITEM_TO_SERVER[item]];
    return claim && Array.isArray(claim.devices) ? claim.devices : [];
  }

  _addKvSplit(entry, peakVramBytes) {
    const kv = BestEffort.read(() => LlmKvBreakdown.fromStatus(this._servers.status('llm')));
    if (!kv || kv.totalKvBytes == null || !(kv.contextSize > 0)) return;
    entry.kvBytesPerKToken = Math.max(0, Math.round(kv.totalKvBytes / (kv.contextSize / 1000)));
    entry.weightsBytes = Math.max(0, peakVramBytes - kv.totalKvBytes);
    entry.measuredContextSize = kv.contextSize;
  }
}

module.exports = MeasuredFootprintRecorder;
