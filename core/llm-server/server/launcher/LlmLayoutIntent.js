const PlacementLayout = require('../../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../../shared/runtime/placement/PlacementStore');
const RemoteDeviceRef = require('../../../shared/runtime/placement/RemoteDeviceRef');

class LlmLayoutIntent {
  static none() {
    return {
      noKvOffload: false,
      vramCapBytes: null,
      splitUserDrawn: false,
      placed: false,
      localDevices: [],
      remote: [],
    };
  }

  static read(settingsDb) {
    const intent = LlmLayoutIntent.none();
    try {
      LlmLayoutIntent._readInto(intent, PlacementStore.load(settingsDb));
    } catch (_) {}
    return intent;
  }

  static _readInto(intent, layout) {
    const items = layout.items || {};
    const ctx = items.llmContext;
    if (ctx && ctx.enabled && ctx.location === 'ram') intent.noKvOffload = true;
    const llm = items.llm;
    if (llm && !llm.split && Number(llm.vramCapBytes) > 0) intent.vramCapBytes = Number(llm.vramCapBytes);
    intent.splitUserDrawn = !!(llm && Array.isArray(llm.split) && llm.split.length > 1);
    LlmLayoutIntent._readResource(intent, layout);
  }

  static _readResource(intent, layout) {
    const resId = PlacementLayout.effectiveResourceId(layout, 'llm');
    const devices = resId ? PlacementLayout.orderedDevices(layout, resId) : null;
    if (devices == null) return;
    intent.placed = true;
    intent.localDevices = devices.filter((d) => !RemoteDeviceRef.isRef(d));
    intent.remote = PlacementLayout.remoteRefsFor(layout, 'llm');
  }
}

module.exports = LlmLayoutIntent;
