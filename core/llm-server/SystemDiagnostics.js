const DiagnosticsGatherer = require('./diagnostics/DiagnosticsGatherer');
const UserPathEditor = require('./diagnostics/UserPathEditor');
const DisplayDeviceRecovery = require('./diagnostics/DisplayDeviceRecovery');
const PcieAspm = require('./diagnostics/PcieAspm');

class SystemDiagnostics {
  static gather({ savedNvidiaSmiPath, runtimesRoot } = {}) {
    return DiagnosticsGatherer.gather({ savedNvidiaSmiPath, runtimesRoot });
  }

  static addDirectoryToUserPath(directory) {
    return UserPathEditor.addDirectory(directory);
  }

  static recoverDisplayDevice(instanceId) {
    return DisplayDeviceRecovery.recover(instanceId);
  }

  static setPcieAspmOff() {
    return PcieAspm.setOff();
  }
}

module.exports = SystemDiagnostics;
