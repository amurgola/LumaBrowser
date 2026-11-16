class TrainerRuntimeSpec {
  static SOURCE_REPO = 'ostris/ai-toolkit';
  static SOURCE_REF = '7a5fe1a8ca72276e1376ce6577f853b480c45576';
  static PYTHON = '3.12';
  static TORCH = Object.freeze({ torch: '2.13.0', torchvision: '0.28.0', torchaudio: '2.11.0' });
  static REVISION = 1;

  static CURRENT_BACKEND = 'cu130';
  static OLDER_BACKEND = 'cu126';
  static TORCH_INDEX_ROOT = 'https://download.pytorch.org/whl';
  static DRIVER_TOO_OLD = 'The NVIDIA driver is too old for the trainer\'s PyTorch build. Update the driver and try again.';
  static NO_PLATFORM = 'LoRA training needs Windows or Linux on x64 or arm64 with an NVIDIA GPU.';

  static UV_TRIPLES = Object.freeze({
    'win32-x64': { triple: 'x86_64-pc-windows-msvc', ext: 'zip' },
    'win32-arm64': { triple: 'x86_64-pc-windows-msvc', ext: 'zip' },
    'linux-x64': { triple: 'x86_64-unknown-linux-gnu', ext: 'tar.gz' },
    'linux-arm64': { triple: 'aarch64-unknown-linux-gnu', ext: 'tar.gz' },
  });

  static sourceArchiveUrl(ref = TrainerRuntimeSpec.SOURCE_REF) {
    return `https://codeload.github.com/${TrainerRuntimeSpec.SOURCE_REPO}/zip/${ref}`;
  }

  static uvAsset(platform = process.platform, arch = process.arch) {
    const asset = TrainerRuntimeSpec.UV_TRIPLES[`${platform}-${arch}`];
    if (!asset) throw new Error(TrainerRuntimeSpec.NO_PLATFORM);
    const file = `uv-${asset.triple}.${asset.ext}`;
    return { file, url: `https://github.com/astral-sh/uv/releases/latest/download/${file}` };
  }

  static driverCudaVersion(smiBanner) {
    const match = /CUDA(?:\s+[A-Z]+)?\s+Version:\s*([0-9]+)\.([0-9]+)/.exec(String(smiBanner || ''));
    return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
  }

  static torchBackend(cuda) {
    if (!cuda || cuda.major >= 13) return TrainerRuntimeSpec.CURRENT_BACKEND;
    if (cuda.major === 12 && cuda.minor >= 6) return TrainerRuntimeSpec.OLDER_BACKEND;
    throw new Error(TrainerRuntimeSpec.DRIVER_TOO_OLD);
  }

  static torchIndexUrl(backend) {
    return `${TrainerRuntimeSpec.TORCH_INDEX_ROOT}/${backend}`;
  }

  static torchRequirements() {
    return Object.entries(TrainerRuntimeSpec.TORCH).map(([name, version]) => `${name}==${version}`);
  }

  static torchConstraints(backend) {
    return Object.entries(TrainerRuntimeSpec.TORCH).map(([name, version]) => `${name}==${version}+${backend}`);
  }

  static fingerprint() {
    return { sourceRef: TrainerRuntimeSpec.SOURCE_REF, python: TrainerRuntimeSpec.PYTHON, torch: TrainerRuntimeSpec.TORCH.torch, revision: TrainerRuntimeSpec.REVISION };
  }
}

module.exports = TrainerRuntimeSpec;
