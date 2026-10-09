class CudaDevicePicker {
  static PER_CARD_RESERVE_BYTES = 1024 * 1024 * 1024;
  static FREE_FRACTION = 0.8;

  static cardRoomBytes(device, { reserveBytes = CudaDevicePicker.PER_CARD_RESERVE_BYTES } = {}) {
    if (!device || device.freeBytes == null) return 0;
    return Math.max(0, Number(device.freeBytes) - reserveBytes);
  }

  static pick(devices, requiredBytes) {
    if (!devices || devices.length === 0) return [];
    const ranked = CudaDevicePicker._rankByFreeThenPower(devices);
    const need = Number(requiredBytes) > 0 ? Number(requiredBytes) : null;
    if (need == null) return [CudaDevicePicker._pickUnsized(devices, ranked)];
    return CudaDevicePicker._pickSized(ranked, need);
  }

  static _rankByFreeThenPower(devices) {
    const freeKey = (d) => (d.freeBytes != null ? d.freeBytes : -1);
    return devices.slice().sort((a, b) =>
      (freeKey(b) - freeKey(a)) || (b.totalBytes - a.totalBytes) || (a.index - b.index));
  }

  static _pickUnsized(devices, ranked) {
    const idle = ranked.find((d) => d.freeBytes != null && d.freeBytes >= d.totalBytes * CudaDevicePicker.FREE_FRACTION);
    if (idle) return idle;
    if (ranked[0].freeBytes != null) return ranked[0];
    return CudaDevicePicker._mostPowerful(devices);
  }

  static _mostPowerful(devices) {
    return devices.slice().sort((a, b) => (b.totalBytes - a.totalBytes) || (a.index - b.index))[0];
  }

  static _pickSized(ranked, need) {
    const room = (d) => CudaDevicePicker.cardRoomBytes(d);
    const single = ranked.find((d) => room(d) >= need);
    if (single) return [single];
    const candidates = ranked.filter((d) => room(d) > 0);
    const split = CudaDevicePicker._fewestThatFit(candidates, need, room);
    if (split) return split;
    return candidates.length > 0 ? candidates : ranked;
  }

  static _fewestThatFit(candidates, need, room) {
    const picked = [];
    let sum = 0;
    for (const device of candidates) {
      picked.push(device);
      sum += room(device);
      if (sum >= need) return picked;
    }
    return null;
  }
}

module.exports = CudaDevicePicker;
