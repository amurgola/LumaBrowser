class ImageLaunchLog {
  static line({ role, modelId, placement, profile, vaeTiling, cpuOnly, clipNote }) {
    return `[image-server] ${role} model "${modelId}"${ImageLaunchLog._suffixes({ placement, profile, vaeTiling, cpuOnly, clipNote }).join('')}`;
  }

  static _suffixes({ placement, profile, vaeTiling, cpuOnly, clipNote }) {
    const { cudaDevice, offloadToCpu, autoFit } = placement;
    const tiling = `VAE tiling ${vaeTiling ? 'on' : 'OFF'}`;
    return [
      cudaDevice != null && cudaDevice !== '' ? ` → CUDA device ${cudaDevice}` : '',
      autoFit ? ` (auto-fit split, budgets ${autoFit})` : '',
      (profile.isEdit || profile.isWanVideo) && !offloadToCpu ? ` (resident, ${tiling})` : '',
      profile.isWanVideo && offloadToCpu ? ` (${tiling})` : '',
      offloadToCpu ? ' (CPU weight-offload on)' : '',
      cpuOnly ? ' (CPU runtime, no GPU placement)' : '',
      clipNote ? ` (${clipNote})` : '',
    ];
  }
}

module.exports = ImageLaunchLog;
