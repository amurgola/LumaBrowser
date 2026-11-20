export default class SettingJump {
  static CHANNEL = 'core.palette.reveal';

  static DEFAULT_LABEL = 'Show setting';

  static action(settingId, label = SettingJump.DEFAULT_LABEL) {
    return { label, run: () => { SettingJump.reveal(settingId); } };
  }

  static reveal(settingId) {
    const bridge = window.ipcBridge;
    if (!bridge || typeof bridge.invoke !== 'function') return Promise.resolve(null);
    return Promise.resolve(bridge.invoke(SettingJump.CHANNEL, settingId)).catch(() => null);
  }
}
