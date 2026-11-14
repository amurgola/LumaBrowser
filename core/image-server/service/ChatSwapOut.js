const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');
const VramOverride = require('../../shared/runtime/vram/VramOverride');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class ChatSwapOut {
  static CHAT_SERVER_ID = 'llm';

  static cardToFree({ placement, role, settingsDb, claims, cards, requiredBytes }) {
    const card = ChatSwapOut._offloadCard(placement) ?? ChatSwapOut._crowdedOnlyCard(placement, cards, requiredBytes);
    const chat = claims && claims[ChatSwapOut.CHAT_SERVER_ID];
    if (card == null || !chat || !Array.isArray(chat.devices) || !chat.devices.includes(card)) return null;
    return ChatSwapOut._bothAutomatic(settingsDb, role) ? card : null;
  }

  static _offloadCard(placement) {
    if (!placement || !placement.offloadToCpu || placement.cudaDevice == null) return null;
    const card = Number(placement.cudaDevice);
    return Number.isInteger(card) ? card : null;
  }

  static _crowdedOnlyCard(placement, cards, requiredBytes) {
    if (!placement || placement.cudaDevice != null || !Array.isArray(cards) || cards.length !== 1) return null;
    const only = cards[0];
    if (!only || only.freeBytes == null || !Number.isInteger(only.index)) return null;
    const need = Number(requiredBytes);
    return need > 0 && CudaDevicePicker.cardRoomBytes(only) < need ? only.index : null;
  }

  static _bothAutomatic(settingsDb, role) {
    try {
      const layout = PlacementStore.load(settingsDb);
      const automatic = (serverId) => PlacementLayout.effectiveResourceId(layout, PlacementLayout.SERVER_TO_ITEM[serverId]) == null
        && VramOverride.read(settingsDb, serverId) === undefined;
      return automatic(role) && automatic(ChatSwapOut.CHAT_SERVER_ID);
    } catch (_) {
      return false;
    }
  }
}

module.exports = ChatSwapOut;
