export default class RemoteRefs {
  static PATTERN = /^r:.+:\d+$/;

  static isRemote(value) {
    return typeof value === 'string' && RemoteRefs.PATTERN.test(value);
  }

  static find(snapshot, ref) {
    return ((snapshot && snapshot.remoteDevices) || []).find((d) => d.ref === ref) || null;
  }

  static resourceHasRemote(resource) {
    return !!(resource && (resource.devices || []).some(RemoteRefs.isRemote));
  }

  static indexOf(ref) {
    const parts = ref.split(':');
    return Number(parts[parts.length - 1]);
  }
}
