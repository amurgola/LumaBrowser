export default class MicPreference {
  static STORE_KEY = 'lumaVoice.micDeviceId';
  static CONSTRAINTS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

  static savedId() {
    try { return localStorage.getItem(MicPreference.STORE_KEY) || ''; } catch (_) { return ''; }
  }

  static save(id) {
    try {
      if (id) localStorage.setItem(MicPreference.STORE_KEY, id);
      else localStorage.removeItem(MicPreference.STORE_KEY);
    } catch (_) {}
  }

  static async openStream(deviceId) {
    const id = deviceId !== undefined ? deviceId : MicPreference.savedId();
    if (id) {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: { ...MicPreference.CONSTRAINTS, deviceId: { exact: id } } });
      } catch (err) {
        if (deviceId !== undefined) throw err;
        MicPreference.save('');
      }
    }
    return navigator.mediaDevices.getUserMedia({ audio: { ...MicPreference.CONSTRAINTS } });
  }
}
