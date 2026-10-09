const CudaDevicePicker = require('../CudaDevicePicker');

class AutoVramPlacement {
  static place(devices, { requiredBytes, allowSplit }) {
    const need = Number(requiredBytes) > 0 ? Number(requiredBytes) : undefined;
    if (need != null && allowSplit === false) return AutoVramPlacement._placeUnsplittable(devices, need);
    return AutoVramPlacement._placeSplittable(devices, need);
  }

  static cudaDeviceFor({ devices, offloadToCpu }, cardCount) {
    if (!offloadToCpu && devices.length === cardCount) return null;
    return devices.length ? devices.join(',') : null;
  }

  static _placeUnsplittable(devices, need) {
    const fits = devices
      .filter((d) => AutoVramPlacement._room(d) >= need)
      .sort((a, b) => AutoVramPlacement._room(b) - AutoVramPlacement._room(a));
    if (fits.length) return { devices: [fits[0].index], offloadToCpu: false };
    return AutoVramPlacement._offloadTo(devices, []);
  }

  static _placeSplittable(devices, need) {
    const chosen = CudaDevicePicker.pick(devices, need);
    const indexes = chosen.map((d) => d.index);
    if (need == null) return { devices: indexes, offloadToCpu: false };
    const room = chosen.reduce((sum, d) => sum + AutoVramPlacement._room(d), 0);
    if (room >= need) return { devices: indexes, offloadToCpu: false };
    return AutoVramPlacement._offloadTo(devices, indexes);
  }

  static _offloadTo(devices, fallback) {
    const emptiest = AutoVramPlacement._emptiest(devices);
    return { devices: emptiest ? [emptiest.index] : fallback, offloadToCpu: true };
  }

  static _emptiest(devices) {
    const free = (d) => (d.freeBytes != null ? d.freeBytes : -1);
    return devices.slice().sort((a, b) => free(b) - free(a))[0];
  }

  static _room(device) {
    return CudaDevicePicker.cardRoomBytes(device, { reserveBytes: CudaDevicePicker.PER_CARD_RESERVE_BYTES });
  }
}

module.exports = AutoVramPlacement;
