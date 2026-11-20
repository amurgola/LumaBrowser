const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');
const NvidiaSmiStream = require('../../shared/runtime/NvidiaSmiStream');

class LlmResidentVram {
  static MIB = 1024 * 1024;

  constructor({
    readCards = () => CudaDeviceProbe.readDevices(null),
    refresh = () => NvidiaSmiStream.shared.refresh({ maxAgeMs: 0 }),
  } = {}) {
    this._readCards = readCards;
    this._refresh = refresh;
    this._before = null;
    this._held = new Map();
  }

  noteLoadStarting() {
    this._held = new Map();
    this._before = LlmResidentVram._freeByCard(this._cards());
  }

  async noteReady() {
    const before = this._before;
    if (!before) return;
    try { await this._refresh(); } catch (_) {}
    if (this._before !== before) return;
    const held = new Map();
    for (const [index, freeNow] of LlmResidentVram._freeByCard(this._cards())) {
      if (before.has(index)) held.set(index, Math.max(0, before.get(index) - freeNow));
    }
    this._held = held;
  }

  clear() {
    this._before = null;
    this._held = new Map();
  }

  heldBytes(cardIndex) {
    return this._held.get(cardIndex) || 0;
  }

  withoutOwn(diagnostics) {
    const devices = CudaDeviceProbe.diagnosticsDevices(diagnostics);
    if (!devices || this._held.size === 0) return diagnostics;
    const MIB = LlmResidentVram.MIB;
    const freed = devices.map((device, index) => {
      if (device.memoryFreeMB == null) return device;
      const free = Number(device.memoryFreeMB) + Math.round(this.heldBytes(index) / MIB);
      return { ...device, memoryFreeMB: Math.min(Number(device.memoryTotalMB) || free, free) };
    });
    return { ...diagnostics, cuda: { ...diagnostics.cuda, devices: freed } };
  }

  _cards() {
    try { return this._readCards() || []; } catch (_) { return []; }
  }

  static _freeByCard(cards) {
    const free = new Map();
    for (const card of cards) {
      if (card && Number.isInteger(card.index) && card.freeBytes != null) free.set(card.index, Number(card.freeBytes));
    }
    return free;
  }
}

module.exports = LlmResidentVram;
