const os = require('os');

class HiddenTabState {
  static sync(entry) {
    HiddenTabState.syncAudio(entry);
    HiddenTabState.syncPriority(entry);
  }

  static syncAudio(entry) {
    try { entry.webContents.setAudioMuted(!!entry.hidden); } catch (_) {}
  }

  static syncPriority(entry) {
    if (process.platform !== 'win32') return;
    try {
      const pid = entry.webContents.getOSProcessId();
      if (!pid || pid <= 0) return;
      const levels = os.constants.priority;
      os.setPriority(pid, entry.hidden ? levels.PRIORITY_BELOW_NORMAL : levels.PRIORITY_NORMAL);
    } catch (_) {}
  }
}

module.exports = HiddenTabState;
