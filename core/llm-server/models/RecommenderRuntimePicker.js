class RecommenderRuntimePicker {
  static pick(hw, platform = process.platform) {
    if (platform === 'darwin') return 'llama-cpp-cpu';
    if (hw.cudaAvailable) {
      const major = Number(String(hw.cudaVersion || '').split('.')[0]);
      return major >= 13 ? 'llama-cpp-cuda13' : 'llama-cpp-cuda12';
    }
    if (hw.hasGpu) return 'llama-cpp-vulkan';
    return 'llama-cpp-cpu';
  }
}

module.exports = RecommenderRuntimePicker;
