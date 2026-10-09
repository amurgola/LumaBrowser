class VisionProjectorPlan {
  static resolve({ files, flags, overrides }) {
    const mmprojSuppressed = !!files.mmprojPath && flags.skipFeatures.has('mmproj');
    const mmprojAvailable = !!files.mmprojPath && !mmprojSuppressed;
    const effectiveMmprojPath = (mmprojAvailable && !overrides.suppressMmprojLoad) ? files.mmprojPath : null;
    return {
      mmprojSuppressed,
      mmprojAvailable,
      effectiveMmprojPath,
      effectiveMmprojBytes: effectiveMmprojPath ? files.mmprojBytes : 0,
    };
  }
}

module.exports = VisionProjectorPlan;
