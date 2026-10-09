class HostGlobals {
  static imageServerService() {
    return global.__lumaImageServerService || null;
  }

  static chatRouter() {
    return global.__lumaChatRouter || null;
  }

  static imageAbortSeq() {
    return Number(global.__lumaImageAbortSeq) || 0;
  }

  static lab() {
    return global.__rpLab || null;
  }
}

module.exports = HostGlobals;
