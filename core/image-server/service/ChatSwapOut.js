const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');
const VramOverride = require('../../shared/runtime/vram/VramOverride');

class ChatSwapOut {
  static CHAT_SERVER_ID = 'llm';

  static cardToFree({ placement, role, settingsDb, claims }) {
    const card = ChatSwapOut._offloadCard(placement);
    const chat = claims && claims[ChatSwapOut.CHAT_SERVER_ID];
    if (card == null || !chat || !Array.isArray(chat.devices) || !chat.devices.includes(card)) return null;
    return ChatSwapOut._bothAutomatic(settingsDb, role) ? card : null;
  }

  static _offloadCard(placement) {
    if (!placement || !placement.offloadToCpu || placement.cudaDevice == null) return null;
    const card = Number(placement.cudaDevice);
    return Number.isInteger(card) ? card : null;
  }

  static _bothAutomatic(settingsDb, role) {
    try {
      const layout = PlacementStore.load(settingsDb);
      const automatic = (serverId) => PlacementLayout.effectiveResourceId(layout, PlacementLayout.SERVER_TO_ITEM[serverId]) == null;
      return automatic(role) && automatic(ChatSwapOut.CHAT_SERVER_ID)
        && VramOverride.read(settingsDb, ChatSwapOut.CHAT_SERVER_ID) === undefined;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ChatSwapOut;
