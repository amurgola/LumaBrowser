const MB = 1024 * 1024;

class ImageLoraEntries {
  static ENTRIES = [
    {
      id: 'qwen-image-2-1-viggle-turbo-6step',
      label: 'Viggle Turbo v0.2.1 - 6-step (r128)',
      family: 'qwen-image-2',
      repo: 'Viggle/Qwen-Image-2.1-viggle-turbo',
      file: 'Qwen-Image-2.1-viggle-turbo-v0.2.1-6step-lora-r128.safetensors',
      url: 'https://huggingface.co/Viggle/Qwen-Image-2.1-viggle-turbo/resolve/main/Qwen-Image-2.1-viggle-turbo-v0.2.1-6step-lora-r128.safetensors?download=true',
      approxBytes: 648 * MB,
      blurb: 'Distilled few-step Qwen-Image 2.1: generation AND edits in 6 steps '
        + 'instead of 25 (~2.5x faster sampling) at close to base quality. Weak on '
        + 'multi-reference composites, face swaps and long small text. Keep weight '
        + '1.0, cfg stays 1.0.',
      weight: 1.0,
      preset: { steps: 6, cfgScale: 1.0, sampler: 'euler', sigmaNodes: [1, 0.9375, 0.875, 0.75, 0.5, 0.25] },
      licenseNote: 'Qwen Research License (inherits the base model\'s): research and non-commercial use only.',
    },
    {
      id: 'minimax-h3-turbo-v4',
      label: 'MiniMax-H3 Turbo - v4 (recommended)',
      family: 'minimax-h3',
      repo: 'larryvrh/MiniMax-H3-Turbo-Lora',
      file: 'minimax_h3_turbo_v4_step600_ema.safetensors',
      url: 'https://huggingface.co/larryvrh/MiniMax-H3-Turbo-Lora/resolve/main/minimax_h3_turbo_v4_step600_ema.safetensors?download=true',
      approxBytes: 744 * MB,
      blurb: 'Renders video + audio in 6-8 steps instead of ~20 (~3x faster wall-clock; '
        + '4 steps works but softer). Author\'s current best checkpoint, sharpest '
        + 'micro-detail; may ghost on fast large motion at 4 steps.',
      weight: 1.0,
      preset: { steps: 8, cfgScale: 1.0, sampler: 'euler' },
      licenseNote: 'Derived from MiniMax-H3: the MiniMax-H3 Community License applies.',
    },
    {
      id: 'minimax-h3-turbo-motion',
      label: 'MiniMax-H3 Turbo - heavy-motion (v1 ckpt850)',
      family: 'minimax-h3',
      repo: 'larryvrh/MiniMax-H3-Turbo-Lora',
      file: 'minimax_h3_turbo_4step_ema_ckpt850.safetensors',
      url: 'https://huggingface.co/larryvrh/MiniMax-H3-Turbo-Lora/resolve/main/minimax_h3_turbo_4step_ema_ckpt850.safetensors?download=true',
      approxBytes: 744 * MB,
      blurb: 'Same speedup, earlier training line: slightly less micro-detail but '
        + 'holds together better on fast, large motion. Pick this if clips with '
        + 'action come out smeared on the v4 checkpoint.',
      weight: 1.0,
      preset: { steps: 8, cfgScale: 1.0, sampler: 'euler' },
      licenseNote: 'Derived from MiniMax-H3: the MiniMax-H3 Community License applies.',
    },
    {
      id: 'wan-2-2-t2v-lightning-4step',
      label: 'Wan 2.2 Lightning - T2V 4-step pair',
      family: 'wan-video',
      repo: 'Comfy-Org/Wan_2.2_ComfyUI_Repackaged',
      files: [
        {
          file: 'wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors',
          url: 'https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors?download=true',
          approxBytes: 1170 * MB,
        },
        {
          file: 'wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors',
          url: 'https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors?download=true',
          approxBytes: 1170 * MB,
          highNoise: true,
        },
      ],
      approxBytes: 2340 * MB,
      blurb: 'lightx2v 4-step distill for Wan 2.2 TEXT-to-video (the T2V model): '
        + 'both experts drop from ~10 to 4 steps, ~2.5x faster wall-clock at '
        + 'near-baseline quality. Downloads and attaches the low+high-noise pair '
        + 'in one go. For the I2V / AniSora models use the I2V pair below.',
      weight: 1.0,
      preset: { steps: 4, cfgScale: 3.5, sampler: 'euler', highNoiseSteps: 4, highNoiseCfgScale: 3.5 },
      licenseNote: 'Apache-2.0 (lightx2v), repackaged by Comfy-Org.',
    },
    {
      id: 'wan-2-2-i2v-lightning-4step',
      label: 'Wan 2.2 Lightning - I2V 4-step pair',
      family: 'wan-video',
      repo: 'Comfy-Org/Wan_2.2_ComfyUI_Repackaged',
      files: [
        {
          file: 'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors',
          url: 'https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors?download=true',
          approxBytes: 1170 * MB,
        },
        {
          file: 'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors',
          url: 'https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors?download=true',
          approxBytes: 1170 * MB,
          highNoise: true,
        },
      ],
      approxBytes: 2340 * MB,
      blurb: 'lightx2v 4-step distill for Wan 2.2 IMAGE-to-video ("animate this '
        + 'image"), the pick for the I2V model and the AniSora V3.2 anime '
        + 'finetune. Both experts drop to 4 steps, ~2.5x faster. Downloads and '
        + 'attaches the low+high-noise pair in one go.',
      weight: 1.0,
      preset: { steps: 4, cfgScale: 3.5, sampler: 'euler', highNoiseSteps: 4, highNoiseCfgScale: 3.5 },
      licenseNote: 'Apache-2.0 (lightx2v), repackaged by Comfy-Org.',
    },
    {
      id: 'pixel-art-xl',
      label: 'Pixel Art XL (nerijs)',
      family: 'sdxl',
      repo: 'nerijs/pixel-art-xl',
      file: 'pixel-art-xl.safetensors',
      url: 'https://huggingface.co/nerijs/pixel-art-xl/resolve/main/pixel-art-xl.safetensors?download=true',
      approxBytes: 170543052,
      blurb: 'The community-standard SDXL pixel-art LoRA. Locks output onto a real '
        + 'pixel grid look with clean dithering. Pairs with the Sprite Shaper '
        + 'checkpoint for the full pixel stack; still generate large and let the '
        + 'K-Centroid post-chain downscale.',
      weight: 1.2,
      trigger: 'pixel art',
      licenseNote: 'CreativeML Open RAIL-M.',
    },
    {
      id: 'flux-seamless-texture',
      label: 'Seamless Texture (gokaygokay)',
      family: 'chroma',
      repo: 'gokaygokay/Flux-Seamless-Texture-LoRA',
      file: 'seamless_texture.safetensors',
      url: 'https://huggingface.co/gokaygokay/Flux-Seamless-Texture-LoRA/resolve/main/seamless_texture.safetensors?download=true',
      approxBytes: 89745224,
      blurb: 'Tileable game textures (stone, grass, metal, scales) on the Chroma '
        + 'base. sd.cpp has no seamless-tiling flag, so the LoRA route is the '
        + 'practical one. Prompt "smlstxtr, <material description>, seamless '
        + 'texture".',
      weight: 1.0,
      trigger: 'smlstxtr',
      licenseNote: 'Apache-2.0.',
    },
    {
      id: 'klein-spritesheet',
      label: '2x2 Sprite Sheet (fal)',
      family: 'flux2',
      repo: 'fal/flux-2-klein-4b-spritesheet-lora',
      file: 'flux-spritesheet-lora.safetensors',
      url: 'https://huggingface.co/fal/flux-2-klein-4b-spritesheet-lora/resolve/main/flux-spritesheet-lora.safetensors?download=true',
      approxBytes: 76039072,
      blurb: 'Turns FLUX.2 klein into a multi-view sprite-sheet generator: one '
        + 'image containing a consistent 2x2 grid of views of the same subject '
        + '(front / side / back / isometric). Prompt "2x2 sprite sheet, <subject>".',
      weight: 1.0,
      trigger: '2x2 sprite sheet',
      licenseNote: 'Apache-2.0 (fal).',
    },
  ];
}

module.exports = ImageLoraEntries;
