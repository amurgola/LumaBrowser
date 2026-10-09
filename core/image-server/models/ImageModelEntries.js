const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;
const SD_CPP_RUNTIMES = ['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu'];
const HF = 'https://huggingface.co';

class ImageModelEntries {
  static WAN_CONSTRAINTS = {
    dimensionMultiple: 16,
    frames: { step: 4, offset: 1, min: 5, max: 81 },
  };

  static T5XXL_Q8 = {
    role: 't5xxl',
    repo: 'city96/t5-v1_1-xxl-encoder-gguf',
    file: 't5-v1_1-xxl-encoder-Q8_0.gguf',
    url: `${HF}/city96/t5-v1_1-xxl-encoder-gguf/resolve/main/t5-v1_1-xxl-encoder-Q8_0.gguf?download=true`,
    approxBytes: 5061584064,
  };

  static FLUX_VAE = {
    role: 'vae',
    repo: 'StableDiffusionVN/Flux',
    file: 'flux_vae.safetensors',
    url: `${HF}/StableDiffusionVN/Flux/resolve/main/Vae/flux_vae.safetensors?download=true`,
    approxBytes: 335 * MB,
  };

  static WAN_VAE = {
    role: 'vae',
    repo: 'Comfy-Org/Wan_2.1_ComfyUI_repackaged',
    file: 'wan_2.1_vae.safetensors',
    url: `${HF}/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors?download=true`,
    approxBytes: 254 * MB,
  };

  static UMT5_Q8 = {
    role: 't5xxl',
    repo: 'city96/umt5-xxl-encoder-gguf',
    file: 'umt5-xxl-encoder-Q8_0.gguf',
    url: `${HF}/city96/umt5-xxl-encoder-gguf/resolve/main/umt5-xxl-encoder-Q8_0.gguf?download=true`,
    approxBytes: 6.0 * GB,
  };

  static WAN_VIDEO_DEFAULTS = {
    width: 832,
    height: 480,
    steps: 10,
    cfgScale: 3.5,
    sampler: 'euler',
    videoFrames: 33,
    fps: 16,
    flowShift: 3,
  };

  static ENTRIES = [
    {
      id: 'z-image-turbo',
      label: 'Z-Image Turbo',
      blurb:
        'Fast 8-step text-to-image from Tongyi. Bilingual (English + Chinese) '
        + 'instruction following. ~6 GB total across diffusion + VAE + text encoder.',
      family: 'z-image',
      kind: 'generate',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'wbruna/Z-Image-Turbo-sdcpp-GGUF',
          file: 'z_image_turbo-Q4_0.gguf',
          url: `${HF}/wbruna/Z-Image-Turbo-sdcpp-GGUF/resolve/main/z_image_turbo-Q4_0.gguf?download=true`,
          approxBytes: 3.47 * GB,
        },
        vae: {
          role: 'vae',
          repo: 'wbruna/Z-Image-Turbo-sdcpp-GGUF',
          file: 'ae-f16.gguf',
          url: `${HF}/wbruna/Z-Image-Turbo-sdcpp-GGUF/resolve/main/ae-f16.gguf?download=true`,
          approxBytes: 168 * MB,
        },
        llm: {
          role: 'llm',
          repo: 'bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF',
          file: 'Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
          url: `${HF}/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf?download=true`,
          approxBytes: 2.5 * GB,
        },
      },
      minVramBytes: 4 * GB,
      defaults: { width: 512, height: 512, steps: 9, cfgScale: 1.0, sampler: 'euler' },
      launchArgs: [],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'qwen-image-edit-2509',
      label: 'Qwen-Image-Edit 2509',
      blurb:
        'Alibaba\'s 20B Qwen-Image-Edit (2509). Character/subject continuity: '
        + 'pass a reference image and place that subject into a new scene via the '
        + 'ref_images API. ~18 GB total at Q4_0 across diffusion + Qwen2.5-VL '
        + 'text encoder + vision projector + VAE. Heavy: needs CPU offload on <24 GB cards.',
      family: 'qwen-image-edit',
      kind: 'edit',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'QuantStack/Qwen-Image-Edit-2509-GGUF',
          file: 'Qwen-Image-Edit-2509-Q4_0.gguf',
          url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q4_0.gguf?download=true`,
          approxBytes: 11928271392,
          quants: [
            { id: 'Q4_0', label: 'Q4_0 - recommended (safe, balanced)', file: 'Qwen-Image-Edit-2509-Q4_0.gguf', url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q4_0.gguf?download=true`, approxBytes: 11928271392, recVramBytes: 14 * GB, default: true },
            { id: 'Q4_K_M', label: 'Q4_K_M - may render black (sd.cpp #1385)', file: 'Qwen-Image-Edit-2509-Q4_K_M.gguf', url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q4_K_M.gguf?download=true`, approxBytes: 13065746976, recVramBytes: 16 * GB },
            { id: 'Q5_K_M', label: 'Q5_K_M - may render black (sd.cpp #1385)', file: 'Qwen-Image-Edit-2509-Q5_K_M.gguf', url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q5_K_M.gguf?download=true`, approxBytes: 14934899232, recVramBytes: 18 * GB },
            { id: 'Q6_K', label: 'Q6_K - high quality (safe)', file: 'Qwen-Image-Edit-2509-Q6_K.gguf', url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q6_K.gguf?download=true`, approxBytes: 16824990240, recVramBytes: 20 * GB },
            { id: 'Q8_0', label: 'Q8_0 - near-lossless (safe)', file: 'Qwen-Image-Edit-2509-Q8_0.gguf', url: `${HF}/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q8_0.gguf?download=true`, approxBytes: 21761817120, recVramBytes: 24 * GB },
          ],
        },
        vae: {
          role: 'vae',
          repo: 'Comfy-Org/Qwen-Image_ComfyUI',
          file: 'qwen_image_vae.safetensors',
          url: `${HF}/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors?download=true`,
          approxBytes: 253806246,
        },
        llm: {
          role: 'llm',
          repo: 'mradermacher/Qwen2.5-VL-7B-Instruct-GGUF',
          file: 'Qwen2.5-VL-7B-Instruct.Q4_K_M.gguf',
          url: `${HF}/mradermacher/Qwen2.5-VL-7B-Instruct-GGUF/resolve/main/Qwen2.5-VL-7B-Instruct.Q4_K_M.gguf?download=true`,
          approxBytes: 4683072512,
        },
        vision: {
          role: 'vision',
          repo: 'mradermacher/Qwen2.5-VL-7B-Instruct-GGUF',
          file: 'Qwen2.5-VL-7B-Instruct.mmproj-Q8_0.gguf',
          url: `${HF}/mradermacher/Qwen2.5-VL-7B-Instruct-GGUF/resolve/main/Qwen2.5-VL-7B-Instruct.mmproj-Q8_0.gguf?download=true`,
          approxBytes: 853119712,
          loaderFlag: '--llm_vision',
        },
      },
      minVramBytes: 24 * GB,
      defaults: { width: 1024, height: 1024, steps: 20, cfgScale: 2.5, sampler: 'euler' },
      launchArgs: ['--flow-shift', '3', '--offload-to-cpu'],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'qwen-image-2-1',
      label: 'Qwen-Image 2.1',
      blurb:
        'Alibaba\'s Qwen-Image 2.1 (Sept 2026): one 7B model that both generates '
        + 'and edits. Strong prompt following and text rendering, up to 2K output, '
        + 'and edits from up to 10 reference images through its Qwen3-VL-8B '
        + 'encoder. Can be set as BOTH the generation and the edit default without '
        + 'loading twice. ~14.6 GB total at Q8_0 across diffusion + encoder + '
        + 'vision projector + VAE. Needs a stable-diffusion.cpp build from '
        + '2026-09-20 or newer: update the runtime in Setup if it fails to load.',
      family: 'qwen-image-2',
      kind: 'generate',
      supportsEdit: true,
      licenseNote: 'Qwen Research License: research and non-commercial use only. Check the model card before commercial use.',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'leejet/Qwen-Image-2.1-GGUF',
          file: 'qwen_image_2.1-Q8_0.gguf',
          url: `${HF}/leejet/Qwen-Image-2.1-GGUF/resolve/main/qwen_image_2.1-Q8_0.gguf?download=true`,
          approxBytes: 7687155744,
          quants: [
            { id: 'Q8_0', label: 'Q8_0 - recommended (near-lossless)', file: 'qwen_image_2.1-Q8_0.gguf', url: `${HF}/leejet/Qwen-Image-2.1-GGUF/resolve/main/qwen_image_2.1-Q8_0.gguf?download=true`, approxBytes: 7687155744, recVramBytes: 12 * GB, default: true },
            { id: 'Q6_K', label: 'Q6_K - high quality', file: 'qwen_image_2.1-Q6_K.gguf', url: `${HF}/leejet/Qwen-Image-2.1-GGUF/resolve/main/qwen_image_2.1-Q6_K.gguf?download=true`, approxBytes: 5996851232, recVramBytes: 10 * GB },
            { id: 'Q5_0', label: 'Q5_0 - balanced', file: 'qwen_image_2.1-Q5_0.gguf', url: `${HF}/leejet/Qwen-Image-2.1-GGUF/resolve/main/qwen_image_2.1-Q5_0.gguf?download=true`, approxBytes: 5069910048, recVramBytes: 10 * GB },
            { id: 'Q4_0', label: 'Q4_0 - smallest (safe)', file: 'qwen_image_2.1-Q4_0.gguf', url: `${HF}/leejet/Qwen-Image-2.1-GGUF/resolve/main/qwen_image_2.1-Q4_0.gguf?download=true`, approxBytes: 4197494816, recVramBytes: 8 * GB },
          ],
        },
        vae: {
          role: 'vae',
          repo: 'madebyollin/texture-fix-vae-for-qwen-image-2.1',
          file: 'texture_fix_vae_for_qwen_image_2.1_bf16.safetensors',
          url: `${HF}/madebyollin/texture-fix-vae-for-qwen-image-2.1/resolve/main/texture_fix_vae_for_qwen_image_2.1_bf16.safetensors?download=true`,
          approxBytes: 675509688,
          supersedes: ['qwen_image_2.1_vae_bf16.safetensors'],
          updateNote: 'Texture-fix VAE: removes the checkerboard mesh the stock Qwen-Image 2.1 decoder leaves on fine textures. Same size, drop-in.',
        },
        llm: {
          role: 'llm',
          repo: 'Qwen/Qwen3-VL-8B-Instruct-GGUF',
          file: 'Qwen3VL-8B-Instruct-Q4_K_M.gguf',
          url: `${HF}/Qwen/Qwen3-VL-8B-Instruct-GGUF/resolve/main/Qwen3VL-8B-Instruct-Q4_K_M.gguf?download=true`,
          approxBytes: 5027784800,
        },
        vision: {
          role: 'vision',
          repo: 'Qwen/Qwen3-VL-8B-Instruct-GGUF',
          file: 'mmproj-Qwen3VL-8B-Instruct-F16.gguf',
          url: `${HF}/Qwen/Qwen3-VL-8B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-8B-Instruct-F16.gguf?download=true`,
          approxBytes: 1159029824,
          loaderFlag: '--llm_vision',
        },
      },
      minVramBytes: 12 * GB,
      defaults: {
        width: 1024,
        height: 1024,
        steps: 25,
        cfgScale: 1.0,
        sampler: 'euler',
        promptGuide:
          'This is Qwen-Image 2.1 (LLM-conditioned via Qwen3-VL). Write the positive '
          + 'prompt as a NATURAL-LANGUAGE description: subject, setting, style, '
          + 'lighting, composition, in full sentences. It renders text very well, so '
          + 'spell out any lettering to draw inside quotes. cfg is 1.0, so negative '
          + 'prompts have no effect. For a transparent background start the prompt '
          + 'with: "This is an RGBA image with transparency." and end it with "The '
          + 'image has alpha channel and the background is transparent." When '
          + 'editing, describe the CHANGE as an instruction ("change the sign to say '
          + '…", "make it night") and refer to the reference as the subject.',
      },
      constraints: { dimensionMultiple: 32 },
      launchArgs: ['--clip-on-cpu'],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'sd-1-5',
      label: 'Stable Diffusion 1.5',
      blurb:
        'The classic 2022 model from Stability AI / RunwayML. ~2 GB single '
        + 'file, runs comfortably on 4 GB GPUs, native 512×512. Light, fast, '
        + 'and the base for most older community fine-tunes.',
      family: 'sd-1-5',
      kind: 'generate',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'Comfy-Org/stable-diffusion-v1-5-archive',
          file: 'v1-5-pruned-emaonly-fp16.safetensors',
          url: `${HF}/Comfy-Org/stable-diffusion-v1-5-archive/resolve/main/v1-5-pruned-emaonly-fp16.safetensors?download=true`,
          approxBytes: 2.0 * GB,
          loaderFlag: '-m',
        },
      },
      minVramBytes: 4 * GB,
      defaults: { width: 512, height: 512, steps: 20, cfgScale: 7.0, sampler: 'euler_a' },
      launchArgs: [],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'sdxl-base-1-0',
      label: 'Stable Diffusion XL 1.0 (base)',
      blurb:
        'Stability AI\'s SDXL base. ~6.5 GB single file, native 1024×1024, '
        + 'much better composition and text rendering than SD 1.5. The '
        + 'base most modern fine-tunes (Pony, Juggernaut, RealVis…) are '
        + 'built on top of.',
      family: 'sdxl',
      kind: 'generate',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'stabilityai/stable-diffusion-xl-base-1.0',
          file: 'sd_xl_base_1.0.safetensors',
          url: `${HF}/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors?download=true`,
          approxBytes: 6.46 * GB,
          loaderFlag: '-m',
        },
      },
      minVramBytes: 6 * GB,
      defaults: { width: 1024, height: 1024, steps: 25, cfgScale: 7.0, sampler: 'euler' },
      launchArgs: [],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'sprite-shaper-xl',
      label: 'Pixel Art Diffusion XL: Sprite Shaper',
      blurb:
        'nncyberpunk\'s Sprite Shaper, the community-proven SDXL fine-tune for '
        + 'pixel-art game sprites and scenes. ~6.9 GB single file. Pairs with the '
        + 'nerijs Pixel Art XL LoRA (LoRAs action on the installed row) for the '
        + 'full pixel-art stack; generate large and let the pixel post-chain '
        + 'downscale to sprite size.',
      family: 'sdxl',
      kind: 'generate',
      licenseNote: 'SDXL fine-tune: CreativeML Open RAIL++-M terms apply (check hosted-inference clauses before Network Sharing).',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'nncyberpunk/SDXL1.0_PixelArtDiffusionXL_SpriteShaper',
          file: 'SDXL1.0_PixelArtDiffusionXL_SpriteShaper.safetensors',
          url: `${HF}/nncyberpunk/SDXL1.0_PixelArtDiffusionXL_SpriteShaper/resolve/main/SDXL1.0_PixelArtDiffusionXL_SpriteShaper.safetensors?download=true`,
          approxBytes: 6938040682,
          loaderFlag: '-m',
        },
      },
      minVramBytes: 6 * GB,
      defaults: {
        width: 1024,
        height: 1024,
        steps: 25,
        cfgScale: 7.0,
        sampler: 'euler',
        negativePrompt: 'blurry, smooth shading, gradient, photorealistic, 3d render, jpeg artifacts, watermark, text',
        promptGuide:
          'This is a pixel-art SDXL fine-tune. Lead the prompt with "pixelart" and describe '
          + 'the subject with concrete tags/short phrases ("pixelart, knight with sword and '
          + 'shield, side view, limited palette"). Generate LARGE and downscale; never ask '
          + 'for sprite-size output directly.',
      },
      launchArgs: [],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'flux-1-schnell',
      label: 'FLUX.1 Schnell',
      blurb:
        'Black Forest Labs\' 12B-parameter rectified-flow model: photorealistic '
        + '1024×1024 in 4 steps. Apache-2.0 for commercial use. ~12 GB total '
        + 'across diffusion + VAE + CLIP-L + T5-XXL.',
      family: 'flux',
      kind: 'generate',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'city96/FLUX.1-schnell-gguf',
          file: 'flux1-schnell-Q4_0.gguf',
          url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q4_0.gguf?download=true`,
          approxBytes: 6.77 * GB,
          quants: [
            { id: 'Q4_0', label: 'Q4_0 - balanced', file: 'flux1-schnell-Q4_0.gguf', url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q4_0.gguf?download=true`, approxBytes: 6.77 * GB, recVramBytes: 8 * GB, default: true },
            { id: 'Q5_0', label: 'Q5_0 - sharper', file: 'flux1-schnell-Q5_0.gguf', url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q5_0.gguf?download=true`, approxBytes: 8.27 * GB, recVramBytes: 10 * GB },
            { id: 'Q6_K', label: 'Q6_K - high quality', file: 'flux1-schnell-Q6_K.gguf', url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q6_K.gguf?download=true`, approxBytes: 9.86 * GB, recVramBytes: 12 * GB },
            { id: 'Q8_0', label: 'Q8_0 - near-lossless', file: 'flux1-schnell-Q8_0.gguf', url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q8_0.gguf?download=true`, approxBytes: 12.7 * GB, recVramBytes: 16 * GB },
            { id: 'F16', label: 'F16 - full precision', file: 'flux1-schnell-F16.gguf', url: `${HF}/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-F16.gguf?download=true`, approxBytes: 23.8 * GB, recVramBytes: 26 * GB },
          ],
        },
        vae: { ...ImageModelEntries.FLUX_VAE },
        clip_l: {
          role: 'clip_l',
          repo: 'comfyanonymous/flux_text_encoders',
          file: 'clip_l.safetensors',
          url: `${HF}/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors?download=true`,
          approxBytes: 246 * MB,
        },
        t5xxl: { ...ImageModelEntries.T5XXL_Q8 },
      },
      minVramBytes: 8 * GB,
      defaults: { width: 1024, height: 1024, steps: 8, cfgScale: 1.0, sampler: 'euler' },
      launchArgs: ['--clip-on-cpu'],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'chroma1-hd',
      label: 'Chroma1-HD',
      blurb:
        'Lodestone Rock\'s Chroma1-HD, an 8.9B Flux-Schnell derivative retrained '
        + 'from scratch, fully Apache-2.0 (weights AND serving, so Network Sharing '
        + 'is clean). Strong stylistic range for illustration / game art, real '
        + 'CFG so negative prompts work. ~10 GB total at Q4_0 across diffusion + '
        + 'VAE + T5-XXL.',
      family: 'chroma',
      kind: 'generate',
      licenseNote: 'Apache-2.0 (weights and outputs): free for commercial use and hosting.',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'silveroxides/Chroma1-HD-GGUF',
          file: 'Chroma1-HD-Q4_0.gguf',
          url: `${HF}/silveroxides/Chroma1-HD-GGUF/resolve/main/Chroma1-HD-Q4_0.gguf?download=true`,
          approxBytes: 5432053920,
          quants: [
            { id: 'Q4_0', label: 'Q4_0 - balanced', file: 'Chroma1-HD-Q4_0.gguf', url: `${HF}/silveroxides/Chroma1-HD-GGUF/resolve/main/Chroma1-HD-Q4_0.gguf?download=true`, approxBytes: 5432053920, recVramBytes: 8 * GB, default: true },
            { id: 'Q4_K_M', label: 'Q4_K_M - sharper', file: 'Chroma1-HD-Q4_K_M.gguf', url: `${HF}/silveroxides/Chroma1-HD-GGUF/resolve/main/Chroma1-HD-Q4_K_M.gguf?download=true`, approxBytes: 5566533792, recVramBytes: 8 * GB },
            { id: 'Q6_K', label: 'Q6_K - high quality', file: 'Chroma1-HD-Q6_K.gguf', url: `${HF}/silveroxides/Chroma1-HD-GGUF/resolve/main/Chroma1-HD-Q6_K.gguf?download=true`, approxBytes: 7.13 * GB, recVramBytes: 10 * GB },
            { id: 'Q8_0', label: 'Q8_0 - near-lossless', file: 'Chroma1-HD-Q8_0.gguf', url: `${HF}/silveroxides/Chroma1-HD-GGUF/resolve/main/Chroma1-HD-Q8_0.gguf?download=true`, approxBytes: 9.07 * GB, recVramBytes: 12 * GB },
          ],
        },
        vae: { ...ImageModelEntries.FLUX_VAE },
        t5xxl: { ...ImageModelEntries.T5XXL_Q8 },
      },
      minVramBytes: 8 * GB,
      defaults: {
        width: 1024,
        height: 1024,
        steps: 20,
        cfgScale: 4.0,
        sampler: 'dpm++2m',
        scheduler: 'beta',
        negativePrompt: 'low quality, blurry, out of focus, deformed, jpeg artifacts, watermark, text, signature',
        promptGuide:
          'This is Chroma (Flux-class, T5-conditioned). Write the positive prompt as a '
          + 'concise NATURAL-LANGUAGE description: subject, style, setting, lighting, '
          + 'composition. It follows style words well ("flat vector illustration", '
          + '"hand-painted fantasy art"). Negative prompts DO work on this model.',
      },
      launchArgs: ['--clip-on-cpu'],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'chroma1-flash',
      label: 'Chroma1-Flash',
      blurb:
        'Lodestone Rock\'s Chroma1-Flash: Chroma1-HD with the CFG "baked in" '
        + '(the model card\'s fast variant): 8 steps at CFG 1 instead of HD\'s '
        + '26 steps at CFG 4, so ~6x fewer forward passes. Same Apache-2.0 '
        + 'weights, same VAE + T5-XXL. The community guide calls 512 its comfort '
        + 'resolution, which is exactly where game sprites render; expect a '
        + 'touch more grain than HD on big painted backdrops.',
      family: 'chroma',
      kind: 'generate',
      licenseNote: 'Apache-2.0 (weights and outputs): free for commercial use and hosting.',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'silveroxides/Chroma1-Flash-GGUF',
          file: 'Chroma1-HD-Flash-Q4_0.gguf',
          url: `${HF}/silveroxides/Chroma1-Flash-GGUF/resolve/main/Chroma1-HD-Flash-Q4_0.gguf?download=true`,
          approxBytes: 5432053920,
          quants: [
            { id: 'Q4_0', label: 'Q4_0 - balanced', file: 'Chroma1-HD-Flash-Q4_0.gguf', url: `${HF}/silveroxides/Chroma1-Flash-GGUF/resolve/main/Chroma1-HD-Flash-Q4_0.gguf?download=true`, approxBytes: 5432053920, recVramBytes: 8 * GB, default: true },
            { id: 'Q4_K_M', label: 'Q4_K_M - sharper', file: 'Chroma1-HD-Flash-Q4_K_M.gguf', url: `${HF}/silveroxides/Chroma1-Flash-GGUF/resolve/main/Chroma1-HD-Flash-Q4_K_M.gguf?download=true`, approxBytes: 5.57 * GB, recVramBytes: 8 * GB },
            { id: 'Q6_K', label: 'Q6_K - high quality', file: 'Chroma1-HD-Flash-Q6_K.gguf', url: `${HF}/silveroxides/Chroma1-Flash-GGUF/resolve/main/Chroma1-HD-Flash-Q6_K.gguf?download=true`, approxBytes: 7.65 * GB, recVramBytes: 10 * GB },
            { id: 'Q8_0', label: 'Q8_0 - near-lossless', file: 'Chroma1-HD-Flash-Q8_0.gguf', url: `${HF}/silveroxides/Chroma1-Flash-GGUF/resolve/main/Chroma1-HD-Flash-Q8_0.gguf?download=true`, approxBytes: 9.74 * GB, recVramBytes: 12 * GB },
          ],
        },
        vae: { ...ImageModelEntries.FLUX_VAE },
        t5xxl: { ...ImageModelEntries.T5XXL_Q8 },
      },
      minVramBytes: 8 * GB,
      defaults: {
        width: 1024,
        height: 1024,
        steps: 8,
        cfgScale: 1.0,
        sampler: 'heun',
        promptGuide:
          'This is Chroma1-Flash (Flux-class, T5-conditioned, CFG baked in). Write '
          + 'the positive prompt as a concise NATURAL-LANGUAGE description: subject, '
          + 'style, setting, lighting, composition. Negative prompts do NOT apply at '
          + 'CFG 1, so put everything you want into the positive prompt.',
      },
      launchArgs: ['--clip-on-cpu'],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'flux-2-klein-4b',
      label: 'FLUX.2 klein 4B',
      blurb:
        'Black Forest Labs\' FLUX.2 klein 4B, the Apache-2.0 member of the '
        + 'FLUX.2 family, size-distilled to 4B and step-distilled to ~4 steps. '
        + 'Modern composition and the best text rendering of the small models; '
        + 'Qwen3-4B as the text encoder. ~8.6 GB total at Q8_0 across diffusion '
        + '+ VAE + encoder.',
      family: 'flux2',
      kind: 'generate',
      licenseNote: 'Apache-2.0 (weights and outputs): free for commercial use and hosting.',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'leejet/FLUX.2-klein-4B-GGUF',
          file: 'flux-2-klein-4b-Q8_0.gguf',
          url: `${HF}/leejet/FLUX.2-klein-4B-GGUF/resolve/main/flux-2-klein-4b-Q8_0.gguf?download=true`,
          approxBytes: 4300629440,
          quants: [
            { id: 'Q8_0', label: 'Q8_0 - recommended (4B quantizes poorly below this)', file: 'flux-2-klein-4b-Q8_0.gguf', url: `${HF}/leejet/FLUX.2-klein-4B-GGUF/resolve/main/flux-2-klein-4b-Q8_0.gguf?download=true`, approxBytes: 4300629440, recVramBytes: 8 * GB, default: true },
            { id: 'Q4_0', label: 'Q4_0 - smallest', file: 'flux-2-klein-4b-Q4_0.gguf', url: `${HF}/leejet/FLUX.2-klein-4B-GGUF/resolve/main/flux-2-klein-4b-Q4_0.gguf?download=true`, approxBytes: 2460378560, recVramBytes: 6 * GB },
          ],
        },
        vae: {
          role: 'vae',
          repo: 'Comfy-Org/flux2-dev',
          file: 'flux2-vae.safetensors',
          url: `${HF}/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors?download=true`,
          approxBytes: 333 * MB,
        },
        llm: {
          role: 'llm',
          repo: 'unsloth/Qwen3-4B-GGUF',
          file: 'Qwen3-4B-Q8_0.gguf',
          url: `${HF}/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q8_0.gguf?download=true`,
          approxBytes: 3.99 * GB,
        },
      },
      minVramBytes: 8 * GB,
      defaults: {
        width: 1024,
        height: 1024,
        steps: 6,
        cfgScale: 1.0,
        sampler: 'euler',
        promptGuide:
          'This is FLUX.2 klein (LLM-conditioned via Qwen3). Write the positive prompt '
          + 'as a NATURAL-LANGUAGE description with concrete nouns and style words; it '
          + 'follows layout and lettering instructions unusually well for its size, so '
          + 'spell out any text to render in quotes. cfg is fixed at 1.0, so negative '
          + 'prompts have no effect on this model.',
      },
      launchArgs: [],
      protocol: 'sd-cpp-http',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'wan-2-2-t2v-a14b',
      label: 'Wan 2.2 T2V A14B',
      blurb:
        'Alibaba\'s Wan 2.2 text-to-video (A14B MoE: a high-noise + a low-noise '
        + 'expert). Apache-2.0, the current open local quality leader. Generates a '
        + 'short 480p/720p clip from a prompt. Text-to-video ONLY: to animate a '
        + 'still image install the I2V sibling below. ~23 GB total at Q4 across '
        + 'the two experts + UMT5 text encoder + VAE. Heavy: CPU weight-offload '
        + 'on <24 GB cards.',
      family: 'wan-video',
      kind: 'video',
      supportsI2V: false,
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'QuantStack/Wan2.2-T2V-A14B-GGUF',
          file: 'Wan2.2-T2V-A14B-LowNoise-Q4_0.gguf',
          url: `${HF}/QuantStack/Wan2.2-T2V-A14B-GGUF/resolve/main/LowNoise/Wan2.2-T2V-A14B-LowNoise-Q4_0.gguf?download=true`,
          approxBytes: 8.5 * GB,
        },
        highNoise: {
          role: 'highNoise',
          repo: 'QuantStack/Wan2.2-T2V-A14B-GGUF',
          file: 'Wan2.2-T2V-A14B-HighNoise-Q4_0.gguf',
          url: `${HF}/QuantStack/Wan2.2-T2V-A14B-GGUF/resolve/main/HighNoise/Wan2.2-T2V-A14B-HighNoise-Q4_0.gguf?download=true`,
          approxBytes: 8.5 * GB,
        },
        vae: { ...ImageModelEntries.WAN_VAE },
        t5xxl: { ...ImageModelEntries.UMT5_Q8 },
      },
      minVramBytes: 24 * GB,
      defaults: { ...ImageModelEntries.WAN_VIDEO_DEFAULTS },
      constraints: ImageModelEntries.WAN_CONSTRAINTS,
      launchArgs: [],
      protocol: 'sd-cpp-video',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'wan-2-2-i2v-a14b',
      label: 'Wan 2.2 I2V A14B',
      blurb:
        'Alibaba\'s Wan 2.2 image-to-video (A14B MoE). The model behind '
        + '"animate this image": the supplied still becomes the first frame and '
        + 'the clip evolves from it (optionally pin a last frame too). Same '
        + 'two-expert layout, text encoder and VAE as the T2V sibling; no CLIP '
        + 'vision file needed (Wan 2.2 dropped it). ~25 GB on disk at Q4_K_M; '
        + 'CPU weight-offload on <24 GB cards.',
      family: 'wan-video',
      kind: 'video',
      supportsI2V: true,
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'QuantStack/Wan2.2-I2V-A14B-GGUF',
          file: 'Wan2.2-I2V-A14B-LowNoise-Q4_K_M.gguf',
          url: `${HF}/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/LowNoise/Wan2.2-I2V-A14B-LowNoise-Q4_K_M.gguf?download=true`,
          approxBytes: 9.0 * GB,
        },
        highNoise: {
          role: 'highNoise',
          repo: 'QuantStack/Wan2.2-I2V-A14B-GGUF',
          file: 'Wan2.2-I2V-A14B-HighNoise-Q4_K_M.gguf',
          url: `${HF}/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/HighNoise/Wan2.2-I2V-A14B-HighNoise-Q4_K_M.gguf?download=true`,
          approxBytes: 9.0 * GB,
        },
        vae: { ...ImageModelEntries.WAN_VAE },
        t5xxl: { ...ImageModelEntries.UMT5_Q8 },
      },
      minVramBytes: 24 * GB,
      defaults: { ...ImageModelEntries.WAN_VIDEO_DEFAULTS },
      constraints: ImageModelEntries.WAN_CONSTRAINTS,
      launchArgs: [],
      protocol: 'sd-cpp-video',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'anisora-v3-2',
      label: 'AniSora V3.2 (anime I2V)',
      blurb:
        'Bilibili\'s Index-AniSora V3.2, a finetune of Wan 2.2 I2V trained on '
        + 'anime episodes, manga adaptations and VTuber content. The pick for '
        + 'animating anime/stylized stills: holds line art and character style '
        + 'where base Wan drifts toward realistic shading. Apache-2.0. Same '
        + 'two-expert layout, text encoder and VAE as Wan 2.2; ~23 GB on disk '
        + 'at Q4_0. CPU weight-offload on <24 GB cards.',
      family: 'wan-video',
      kind: 'video',
      supportsI2V: true,
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'QuantStack/Index-Anisora-V3.2-GGUF',
          file: 'Index-Anisora-V3.2-Low-Q4_0.gguf',
          url: `${HF}/QuantStack/Index-Anisora-V3.2-GGUF/resolve/main/Low/Index-Anisora-V3.2-Low-Q4_0.gguf?download=true`,
          approxBytes: 8.41 * GB,
        },
        highNoise: {
          role: 'highNoise',
          repo: 'QuantStack/Index-Anisora-V3.2-GGUF',
          file: 'Index-Anisora-V3.2-High-Q4_0.gguf',
          url: `${HF}/QuantStack/Index-Anisora-V3.2-GGUF/resolve/main/High/Index-Anisora-V3.2-High-Q4_0.gguf?download=true`,
          approxBytes: 8.41 * GB,
        },
        vae: { ...ImageModelEntries.WAN_VAE },
        t5xxl: { ...ImageModelEntries.UMT5_Q8 },
      },
      minVramBytes: 24 * GB,
      defaults: { ...ImageModelEntries.WAN_VIDEO_DEFAULTS },
      constraints: ImageModelEntries.WAN_CONSTRAINTS,
      launchArgs: [],
      protocol: 'sd-cpp-video',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'ltx-video-2b',
      label: 'LTX-Video 2B',
      blurb:
        'Lightricks LTX-Video, a fast, lightweight video model. Lower quality '
        + 'than Wan but renders a short clip in a fraction of the time and fits '
        + 'smaller cards. Text-to-video only. ~3-4 GB diffusion at Q4 + T5 '
        + 'encoder + VAE.',
      family: 'ltx-video',
      kind: 'video',
      supportsI2V: false,
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'city96/LTX-Video-gguf',
          file: 'ltx-video-2b-v0.9-Q8_0.gguf',
          url: `${HF}/city96/LTX-Video-gguf/resolve/main/ltx-video-2b-v0.9-Q8_0.gguf?download=true`,
          approxBytes: 3.2 * GB,
        },
        vae: {
          role: 'vae',
          repo: 'Lightricks/LTX-Video',
          file: 'ltx-video-vae.safetensors',
          url: `${HF}/Lightricks/LTX-Video/resolve/main/vae/diffusion_pytorch_model.safetensors?download=true`,
          approxBytes: 800 * MB,
        },
        t5xxl: {
          role: 't5xxl',
          repo: 'city96/t5-v1_1-xxl-encoder-gguf',
          file: 't5-v1_1-xxl-encoder-Q8_0.gguf',
          url: `${HF}/city96/t5-v1_1-xxl-encoder-gguf/resolve/main/t5-v1_1-xxl-encoder-Q8_0.gguf?download=true`,
          approxBytes: 5.0 * GB,
        },
      },
      minVramBytes: 8 * GB,
      defaults: {
        width: 768,
        height: 512,
        steps: 30,
        cfgScale: 3.0,
        sampler: 'euler',
        videoFrames: 49,
        fps: 24,
        flowShift: 3,
      },
      constraints: {
        dimensionMultiple: 32,
        frames: { step: 8, offset: 1, min: 9, max: 257 },
      },
      launchArgs: [],
      protocol: 'sd-cpp-video',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
    {
      id: 'minimax-h3-fl2va',
      label: 'MiniMax-H3 (video + audio)',
      blurb:
        'MiniMax\'s H3, an open-weights audio-video diffusion transformer that '
        + 'generates a clip AND its stereo soundtrack in a single pass (describe '
        + 'the music or sound effects in the prompt). Text-to-video, image-to-'
        + 'video and first-last-frame from one checkpoint, 24 fps, up to ~14 s. '
        + 'The heavyweight of the video list: ~35 GB on disk at Q4 across the '
        + 'diffusion model, the Qwen3-VL-32B text encoder and the two VAEs, so '
        + 'it runs with CPU weight-offload on anything short of a 48 GB card. '
        + 'Needs an sd-server build from 2026-08-04 or later. After install, the '
        + 'row\'s "LoRAs / speed" action can fetch the community Turbo LoRA to '
        + 'render in 6-8 steps instead of ~20 (best on the full, non-pruned quant).',
      family: 'minimax-h3',
      kind: 'video',
      supportsI2V: true,
      licenseNote: 'MiniMax-H3 Community License: review before commercial use.',
      files: {
        diffusion: {
          role: 'diffusion',
          repo: 'leejet/MiniMax-H3-GGUF',
          file: 'minimax_h3_fl2va_pruned-Q4_K_M.gguf',
          url: `${HF}/leejet/MiniMax-H3-GGUF/resolve/main/minimax_h3_fl2va_pruned-Q4_K_M.gguf?download=true`,
          approxBytes: 11.42 * GB,
          quants: [
            { id: 'pruned-Q4_K_M', label: 'Pruned Q4_K_M - recommended', file: 'minimax_h3_fl2va_pruned-Q4_K_M.gguf', url: `${HF}/leejet/MiniMax-H3-GGUF/resolve/main/minimax_h3_fl2va_pruned-Q4_K_M.gguf?download=true`, approxBytes: 11.42 * GB, recVramBytes: 16 * GB, default: true },
            { id: 'Q4_K_M', label: 'Full Q4_K_M - higher quality, pairs with the Turbo speed LoRA', file: 'minimax_h3_fl2va-Q4_K_M.gguf', url: `${HF}/leejet/MiniMax-H3-GGUF/resolve/main/minimax_h3_fl2va-Q4_K_M.gguf?download=true`, approxBytes: 18.78 * GB, recVramBytes: 24 * GB },
          ],
        },
        llm: {
          role: 'llm',
          repo: 'leejet/MiniMax-H3-GGUF',
          file: 'qwen3vl_32b_minimax_h3-Q4_K_M.gguf',
          url: `${HF}/leejet/MiniMax-H3-GGUF/resolve/main/qwen3vl_32b_minimax_h3-Q4_K_M.gguf?download=true`,
          approxBytes: 18.22 * GB,
        },
        vae: {
          role: 'vae',
          repo: 'Comfy-Org/MiniMax-H3',
          file: 'minimax_h3_video_vae_fp16.safetensors',
          url: `${HF}/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors?download=true`,
          approxBytes: 5.21 * GB,
        },
        audioVae: {
          role: 'audioVae',
          repo: 'Comfy-Org/MiniMax-H3',
          file: 'minimax_h3_audio_vae_fp32.safetensors',
          url: `${HF}/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors?download=true`,
          approxBytes: 605 * MB,
        },
      },
      minVramBytes: 40 * GB,
      defaults: {
        width: 864,
        height: 480,
        steps: 20,
        cfgScale: 1.0,
        sampler: 'euler',
        videoFrames: 124,
        fps: 24,
        flowShift: 12,
      },
      constraints: {
        dimensionMultiple: 32,
        frames: { step: 17, offset: 5, min: 5, max: 345 },
        fps: 24,
      },
      launchArgs: ['--rng', 'cpu'],
      protocol: 'sd-cpp-video',
      compatibleRuntimes: [...SD_CPP_RUNTIMES],
    },
  ];
}

module.exports = ImageModelEntries;
