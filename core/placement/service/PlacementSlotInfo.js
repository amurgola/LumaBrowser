const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const BestEffort = require('./BestEffort');

class PlacementSlotInfo {
  constructor({ servers, gpu, vram }) {
    this._servers = servers;
    this._gpu = gpu;
    this._vram = vram;
  }

  build() {
    const ledger = BestEffort.read(() => this._vram.snapshot()) || {};
    const cards = BestEffort.read(() => this._gpu.readDevices(null)) || [];
    const out = { llm: this._llmInfo(ledger, cards) };
    for (const item of PlacementLayout.ITEM_KEYS) {
      if (item !== 'llm') out[item] = this._slotInfo(item, ledger, cards);
    }
    return out;
  }

  _llmInfo(ledger, cards) {
    const status = this._servers.status('llm');
    const claim = ledger.llm || {};
    const devices = PlacementSlotInfo._devicesOf(claim);
    return {
      modelId: this._servers.llmModelLabel(),
      state: status ? status.state : 'idle',
      devices,
      deviceNames: PlacementSlotInfo._namesOf(devices, cards),
      offloadToCpu: !!claim.offloadToCpu,
      vaeTiling: false,
    };
  }

  _slotInfo(item, ledger, cards) {
    const status = this._servers.status(item);
    const plan = (status && status.plan) || {};
    const devices = PlacementSlotInfo._devicesOf(ledger[PlacementLayout.ITEM_TO_SERVER[item]] || {});
    return {
      modelId: plan.modelId || null,
      state: status ? status.state : 'idle',
      devices,
      deviceNames: PlacementSlotInfo._namesOf(devices, cards),
      offloadToCpu: !!plan.offloadToCpu,
      vaeTiling: !!plan.vaeTiling,
    };
  }

  static _devicesOf(claim) {
    return Array.isArray(claim.devices) ? claim.devices.slice() : [];
  }

  static _namesOf(devices, cards) {
    return devices.map((index) => {
      const card = cards.find((c) => c.index === index);
      return card ? card.name : null;
    });
  }
}

module.exports = PlacementSlotInfo;
