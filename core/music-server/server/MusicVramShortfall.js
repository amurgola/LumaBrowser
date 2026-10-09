const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');

class MusicVramShortfall {
  static GB = 1024 ** 3;
  static SERVER_ID = 'music';
  static OVERRIDE_KEY = 'core.musicServer.cudaDevice';
  static DEFAULT_COLOCATED_BYTES = 34 * MusicVramShortfall.GB;
  static DEFAULT_AR_STAGE_BYTES = 20 * MusicVramShortfall.GB;
  static DEFAULT_DIT_STAGE_BYTES = 13 * MusicVramShortfall.GB;

  static colocatedBytes(model) {
    return Number(model && model.minVramBytes) || MusicVramShortfall.DEFAULT_COLOCATED_BYTES;
  }

  static describe({ reservation, model, settingsDb, diagnostics, vramCoordinator }) {
    try {
      if (MusicVramShortfall._hasUserOverride(settingsDb)) return null;
      const cards = MusicVramShortfall._debitedCards(vramCoordinator, diagnostics);
      if (!cards.length) return null;
      return MusicVramShortfall._judge(MusicVramShortfall._targetCards(reservation, cards), cards, model);
    } catch (_) {
      return null;
    }
  }

  static _hasUserOverride(settingsDb) {
    const override = settingsDb && settingsDb.get ? settingsDb.get(MusicVramShortfall.OVERRIDE_KEY, null) : null;
    return override !== null && override !== undefined;
  }

  static _debitedCards(vramCoordinator, diagnostics) {
    if (!vramCoordinator || typeof vramCoordinator.debitedDevices !== 'function') return [];
    return vramCoordinator.debitedDevices(diagnostics, { excludeServerId: MusicVramShortfall.SERVER_ID }) || [];
  }

  static _targetCards(reservation, cards) {
    const reserved = Array.isArray(reservation && reservation.devices) ? reservation.devices : [];
    if (reserved.length) return reserved;
    return cards.length === 1 ? [cards[0].index] : [];
  }

  static _judge(target, cards, model) {
    if (target.length === 1) return MusicVramShortfall._colocatedShortfall(target[0], cards, model);
    if (target.length >= 2) return MusicVramShortfall._stageShortfall(target, cards, model);
    return null;
  }

  static _colocatedShortfall(index, cards, model) {
    const need = MusicVramShortfall.colocatedBytes(model);
    const room = MusicVramShortfall._roomOf(index, cards);
    if (room == null || room >= need) return null;
    return `needs about ${MusicVramShortfall._gb(need)} on one GPU, ${MusicVramShortfall._gb(room)} is free`;
  }

  static _stageShortfall(target, cards, model) {
    const stages = [
      ['first', Number(model.arStageBytes) || MusicVramShortfall.DEFAULT_AR_STAGE_BYTES],
      ['second', Number(model.ditStageBytes) || MusicVramShortfall.DEFAULT_DIT_STAGE_BYTES],
    ];
    for (let i = 0; i < stages.length; i++) {
      const [ordinal, need] = stages[i];
      const room = MusicVramShortfall._roomOf(target[i], cards);
      if (room != null && room < need) {
        return `the ${ordinal} GPU needs about ${MusicVramShortfall._gb(need)}, ${MusicVramShortfall._gb(room)} is free`;
      }
    }
    return null;
  }

  static _roomOf(index, cards) {
    const card = cards.find((c) => c.index === index);
    return card && card.freeBytes != null ? CudaDevicePicker.cardRoomBytes(card) : null;
  }

  static _gb(bytes) {
    return `${(bytes / MusicVramShortfall.GB).toFixed(0)} GB`;
  }
}

module.exports = MusicVramShortfall;
