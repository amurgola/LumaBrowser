const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');
const VramOverride = require('../../shared/runtime/vram/VramOverride');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class ChatSwapOut {
  static CHAT_SERVER_ID = 'llm';

  static cardToFree({ placement, role, settingsDb, claims, cards, requiredBytes }) {
    const chat = claims && claims[ChatSwapOut.CHAT_SERVER_ID];
    if (!chat || !Array.isArray(chat.devices) || !chat.devices.length) return null;
    if (!ChatSwapOut._wouldUseRam(placement, cards, requiredBytes)) return null;
    const card = ChatSwapOut.freeableCard(chat, cards, requiredBytes) ?? ChatSwapOut._crowdedCard(placement, cards);
    if (card == null || !chat.devices.includes(card)) return null;
    return ChatSwapOut._bothAutomatic(settingsDb, role) ? card : null;
  }

  static _crowdedCard(placement, cards) {
    if (placement.offloadToCpu && placement.cudaDevice != null) {
      const card = Number(placement.cudaDevice);
      return Number.isInteger(card) ? card : null;
    }
    const only = Array.isArray(cards) && cards.length === 1 ? cards[0] : null;
    return only && Number.isInteger(only.index) ? only.index : null;
  }

  static freeableCard(chat, cards, requiredBytes) {
    const need = Number(requiredBytes);
    if (!(need > 0) || !Array.isArray(cards)) return null;
    const fitting = cards
      .filter((card) => card && Number.isInteger(card.index) && card.freeBytes != null && chat.devices.includes(card.index))
      .filter((card) => ChatSwapOut.roomOnceFreed(chat, card) >= need)
      .sort((a, b) => (Number(b.totalBytes) - Number(a.totalBytes)) || (a.index - b.index));
    return fitting.length ? fitting[0].index : null;
  }

  static roomOnceFreed(chat, card) {
    const ceiling = Math.max(0, Number(card.totalBytes) - CudaDevicePicker.PER_CARD_RESERVE_BYTES);
    const share = ChatSwapOut._chatShare(chat, card.index);
    const room = CudaDevicePicker.cardRoomBytes(card) + (share > 0 ? share : ceiling);
    return Math.min(ceiling, room);
  }

  static _chatShare(chat, index) {
    const bytes = Number(chat.bytes) || 0;
    const at = chat.devices.indexOf(index);
    if (!(bytes > 0) || at < 0) return 0;
    const weight = Array.isArray(chat.weights) && chat.weights.length === chat.devices.length ? Number(chat.weights[at]) : 1 / chat.devices.length;
    return bytes * (Number.isFinite(weight) ? weight : 0);
  }

  static _wouldUseRam(placement, cards, requiredBytes) {
    if (!placement) return false;
    if (placement.offloadToCpu) return true;
    if (placement.cudaDevice != null || !Array.isArray(cards) || cards.length !== 1) return false;
    const only = cards[0];
    if (!only || only.freeBytes == null) return false;
    const need = Number(requiredBytes);
    return need > 0 && CudaDevicePicker.cardRoomBytes(only) < need;
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
