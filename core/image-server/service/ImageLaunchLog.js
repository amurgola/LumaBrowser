class ImageLaunchLog {
  static line({ role, modelId, placement, profile, vaeTiling, cpuOnly, clipNote, runtimeNote, int8Weights, sageNote }) {
    const suffixes = ImageLaunchLog._suffixes({ placement, profile, vaeTiling, cpuOnly, clipNote, runtimeNote, int8Weights, sageNote });
    return `[image-server] ${role} model "${modelId}"${suffixes.join('')}`;
  }

  static _suffixes({ placement, profile, vaeTiling, cpuOnly, clipNote, runtimeNote, int8Weights, sageNote }) {
    const { cudaDevice, offloadToCpu, autoFit } = placement;
    const tiling = `VAE tiling ${vaeTiling ? 'on' : 'OFF'}`;
    return [
      cudaDevice != null && cudaDevice !== '' ? ` → CUDA device ${cudaDevice}` : '',
      autoFit && String(cudaDevice).includes(',') ? ` (auto-fit split, budgets ${autoFit})` : '',
      autoFit && !String(cudaDevice).includes(',') ? ` (VRAM budget ${autoFit}, card shared)` : '',
      (profile.isEdit || profile.isWanVideo) && !offloadToCpu ? ` (resident, ${tiling})` : '',
      profile.isWanVideo && offloadToCpu ? ` (${tiling})` : '',
      offloadToCpu ? ' (CPU weight-offload on)' : '',
      cpuOnly ? ' (CPU runtime, no GPU placement)' : '',
      clipNote ? ` (${clipNote})` : '',
      runtimeNote ? ` (${runtimeNote})` : '',
      int8Weights ? ' (INT8 weights)' : '',
      sageNote ? ` (${sageNote})` : '',
    ];
  }
}

module.exports = ImageLaunchLog;
