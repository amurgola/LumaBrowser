const PlacementLayout = require('../PlacementLayout');
const RemoteDeviceRef = require('./RemoteDeviceRef');
const CudaDeviceProbe = require('../CudaDeviceProbe');
const CudaDevicePicker = require('../CudaDevicePicker');

class PlacementResolver {
  static resolve(layout, serverId, { diagnostics, requiredBytes, allowSplit = true, devices: debited } = {}) {
    const res = PlacementResolver._resourceFor(layout, serverId);
    if (!res) return null;
    if (res.kind === 'ram') return PlacementResolver._ramOffload();
    const room = PlacementResolver.deviceRoomMap(diagnostics, debited);
    const devices = PlacementResolver._presentLocalDevices(res, room);
    if (devices.length === 0) return null;
    const need = Number(requiredBytes) > 0 ? Number(requiredBytes) : null;
    const roomOf = (idx) => PlacementResolver._roomOf(room, idx);
    if (allowSplit === false) return PlacementResolver._placeUnsplittable(devices, need, roomOf);
    return PlacementResolver._placeSplittable(layout, serverId, devices, need, roomOf);
  }

  static deviceRoomMap(diagnostics, devices) {
    const list = devices || CudaDeviceProbe.readDevices(diagnostics) || [];
    const map = new Map();
    for (const d of list) {
      const room = d.freeBytes != null ? Math.max(0, d.freeBytes - CudaDevicePicker.PER_CARD_RESERVE_BYTES) : null;
      map.set(d.index, { total: d.totalBytes, free: d.freeBytes, room });
    }
    return map;
  }

  static _resourceFor(layout, serverId) {
    const itemKey = PlacementLayout.SERVER_TO_ITEM[serverId];
    if (!itemKey) return null;
    return PlacementLayout.resourceById(layout, PlacementLayout.effectiveResourceId(layout, itemKey));
  }

  static _ramOffload() {
    return { cudaDevice: null, offloadToCpu: true, devices: [], split: null };
  }

  static _presentLocalDevices(res, room) {
    return res.devices.filter((d) => !RemoteDeviceRef.isRef(d) && (room.size === 0 || room.has(d)));
  }

  static _roomOf(room, idx) {
    const entry = room.get(idx);
    return entry && entry.room != null ? entry.room : 0;
  }

  static _single(idx, offloadToCpu = false) {
    return { cudaDevice: String(idx), offloadToCpu, devices: [idx], split: null };
  }

  static _placeUnsplittable(devices, need, roomOf) {
    const target = need != null ? devices.find((idx) => roomOf(idx) >= need) : undefined;
    if (target != null) return PlacementResolver._single(target);
    if (need != null && devices.every((idx) => roomOf(idx) > 0 && roomOf(idx) < need)) {
      return PlacementResolver._single(devices[0], true);
    }
    return PlacementResolver._single(devices[0]);
  }

  static _placeSplittable(layout, serverId, devices, need, roomOf) {
    const explicit = PlacementResolver._explicitSplit(layout, serverId, devices);
    if (explicit) return { cudaDevice: devices.join(','), offloadToCpu: false, devices: devices.slice(), split: explicit };
    if (need == null) return PlacementResolver._single(devices[0]);
    const used = PlacementResolver._smallestFittingPrefix(devices, need, roomOf);
    if (used.length === 1) return PlacementResolver._single(used[0]);
    return { cudaDevice: used.join(','), offloadToCpu: false, devices: used, split: PlacementResolver._roomSplit(used, roomOf) };
  }

  static _explicitSplit(layout, serverId, devices) {
    const item = layout.items && layout.items[PlacementLayout.SERVER_TO_ITEM[serverId]];
    const split = item && item.split;
    return split && split.length === devices.length && devices.length > 1 ? split.slice() : null;
  }

  static _smallestFittingPrefix(devices, need, roomOf) {
    const used = [];
    let sum = 0;
    for (const idx of devices) {
      used.push(idx);
      sum += roomOf(idx);
      if (sum >= need) break;
    }
    return used;
  }

  static _roomSplit(used, roomOf) {
    const rooms = used.map((idx) => Math.max(1, roomOf(idx)));
    const total = rooms.reduce((s, v) => s + v, 0);
    return rooms.map((v) => Math.round((v / total) * 100));
  }
}

module.exports = PlacementResolver;
