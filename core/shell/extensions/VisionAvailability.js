const fs = require('fs');
const path = require('path');

class VisionAvailability {
  static LOCAL_PREFIX = 'local::';
  static PROJECTOR_NAME = /mmproj/i;
  static GGUF_EXT = /\.gguf$/i;

  static check(modelRef, llmServerService, fsOps = fs) {
    if (typeof modelRef === 'string' && modelRef && !modelRef.startsWith(VisionAvailability.LOCAL_PREFIX)) return true;
    try {
      const plan = VisionAvailability._livePlan(llmServerService);
      if (plan) return !!(plan.mmprojPath || plan.mmprojAvailable);
      return VisionAvailability._projectorBesideModel(llmServerService, fsOps);
    } catch (_) {
      return false;
    }
  }

  static _livePlan(svc) {
    const status = svc && svc.runtimeServer && svc.runtimeServer.getStatus();
    return (status && status.plan) || null;
  }

  static _projectorBesideModel(svc, fsOps) {
    const modelPath = svc && typeof svc.getDefaults === 'function' && svc.getDefaults().modelPath;
    if (!modelPath) return false;
    return fsOps.readdirSync(path.dirname(modelPath))
      .some((name) => VisionAvailability.PROJECTOR_NAME.test(name) && VisionAvailability.GGUF_EXT.test(name));
  }
}

module.exports = VisionAvailability;
