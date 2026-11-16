const ImageTrainingRegistry = require('../../core/image-server/models/ImageTrainingRegistry');

class TrainingRecipes {
  static TAGS = 'tags';
  static SENTENCE = 'sentence';

  static RECIPES = Object.freeze([
    {
      id: 'sdxl',
      label: 'SDXL',
      families: ['sdxl'],
      arch: 'sdxl',
      base: { kind: 'installed-file', role: 'diffusion' },
      captionStyle: TrainingRecipes.TAGS,
      steps: 2000,
      minVramGb: 12,
      model: { quantize: false, quantize_te: false },
      train: { noise_scheduler: 'ddpm' },
      sample: { sampler: 'ddpm', guidance_scale: 6 },
      note: 'Trains on the installed checkpoint itself, so a Pony or Illustrious fine-tune gets a LoRA made for it.',
    },
    {
      id: 'sd-1-5',
      label: 'SD 1.5',
      families: ['sd-1-5'],
      arch: 'sd1',
      base: { kind: 'installed-file', role: 'diffusion' },
      captionStyle: TrainingRecipes.TAGS,
      steps: 2000,
      minVramGb: 8,
      model: { quantize: false, quantize_te: false },
      train: { noise_scheduler: 'ddpm' },
      dataset: { resolution: [512, 768] },
      sample: { sampler: 'ddpm', guidance_scale: 6, width: 512, height: 512 },
      note: 'Trains on the installed checkpoint itself.',
    },
    {
      id: 'anima',
      label: 'Anima',
      families: ['anima'],
      arch: 'anima',
      base: { kind: 'hub', repo: 'circlestone-labs/Anima-Base-v1.0-Diffusers', approxGb: 5.6 },
      captionStyle: TrainingRecipes.TAGS,
      steps: 2000,
      minVramGb: 12,
      model: { quantize: false, quantize_te: false, qtype: '', qtype_te: '' },
      train: { timestep_type: 'weighted' },
      sample: { neg: 'worst quality, low quality, score_1, score_2, score_3, blurry, jpeg artifacts, sepia, signature, artist name' },
      note: 'Trains on the Anima base weights; the LoRA also applies to Anima Turbo and Anima fine-tunes.',
    },
    {
      id: 'z-image',
      label: 'Z-Image',
      families: ['z-image'],
      arch: 'zimage',
      base: { kind: 'hub', repo: 'Tongyi-MAI/Z-Image', approxGb: 20.5 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 2500,
      minVramGb: 16,
      model: { quantize: true, quantize_te: true, low_vram: true, qtype: 'qfloat8' },
      train: { timestep_type: 'weighted' },
      sample: { sample_steps: 30 },
      note: 'Trains on the Z-Image base weights; the LoRA is used on Z-Image Turbo.',
    },
    {
      id: 'flux2-klein-4b',
      label: 'FLUX.2 klein 4B',
      families: ['flux2'],
      modelIds: ['flux-2-klein-4b'],
      arch: 'flux2_klein_4b',
      base: { kind: 'hub', repo: 'black-forest-labs/FLUX.2-klein-base-4B', approxGb: 16 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 2500,
      minVramGb: 16,
      model: { quantize: true, quantize_te: true, low_vram: true, qtype: 'qfloat8', model_kwargs: { match_target_res: false } },
      train: { timestep_type: 'weighted' },
      note: 'Trains on the klein base 4B weights. The 9B base is a gated download, so the 9B model is not covered.',
    },
    {
      id: 'chroma',
      label: 'Chroma',
      families: ['chroma'],
      arch: 'chroma',
      base: { kind: 'hub', repo: 'lodestones/Chroma1-Base', approxGb: 27.5 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 2500,
      minVramGb: 24,
      model: { quantize: true, quantize_te: true },
      note: 'Trains on Chroma1-Base; the LoRA is used on Chroma1-HD and Chroma1-Flash.',
    },
    {
      id: 'moss-image',
      label: 'MOSS-Image',
      families: ['moss-image'],
      arch: 'moss_image:base',
      base: { kind: 'hub', repo: 'OpenMOSS-Team/MOSS-Image-Base', approxGb: 27 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 2500,
      minVramGb: 24,
      model: {
        quantize: true, qtype: 'convrot8', quantize_te: true, qtype_te: 'convrot8', low_vram: true,
        model_kwargs: { uncond_skip_layers: [22] },
      },
      network: { network_kwargs: { ignore_if_contains: ['layers.22.'] } },
      train: { timestep_type: 'shift' },
      sample: { guidance_scale: 3, sample_steps: 30 },
      note: 'Trains on MOSS-Image Base; the LoRA is used on MOSS-Image SFT.',
    },
    {
      id: 'qwen-image-2',
      label: 'Qwen-Image 2.1',
      families: ['qwen-image-2'],
      arch: 'qwen_image_2',
      base: { kind: 'hub', repo: 'Comfy-Org/Qwen-Image-2.1', approxGb: 18 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 3000,
      minVramGb: 24,
      model: {
        quantize: true, qtype: 'convrot8', quantize_te: true, qtype_te: 'convrot8', low_vram: true,
        model_kwargs: { rgba: false },
      },
      train: { timestep_type: 'shift', unload_text_encoder: false },
      sample: { guidance_scale: 3 },
      note: 'Trains on the pre-quantized Qwen-Image 2.1 weights; the LoRA also applies to the Turbo model.',
    },
    {
      id: 'minimax-h3-image',
      label: 'MiniMax-H3-Image',
      families: ['minimax-h3-image'],
      arch: 'minimax_h3_image',
      base: { kind: 'hub', repo: 'Comfy-Org/MiniMax-H3-Image', approxGb: 38 },
      captionStyle: TrainingRecipes.SENTENCE,
      steps: 2000,
      minVramGb: 32,
      model: {
        quantize: true, qtype: 'convrot8', quantize_te: true, qtype_te: 'nvfp4', low_vram: false,
        assistant_lora_path: 'ostris/minimax_h3_training_adapter/minimax_h3_image_training_adapter_v1.safetensors',
      },
      network: { linear: 16, linear_alpha: 16, network_kwargs: { ignore_if_contains: ['adaln_proj'] } },
      train: { timestep_type: 'shift', cache_text_embeddings: true },
      dataset: { resolution: [2048], cache_latents_to_disk: true },
      sample: { width: 2048, height: 2048, guidance_scale: 1, sample_steps: 6 },
      note: 'Experimental: a step-distilled model trained at 2048 px with its training adapter. Slow and memory hungry.',
    },
  ]);

  static GATED = Object.freeze({
    flux: 'FLUX.1 schnell and dev are gated on Hugging Face.',
    'flux-kontext': 'FLUX.1 Kontext dev is gated on Hugging Face.',
    flux3: 'FLUX.3 Image Klein base is gated on Hugging Face.',
    krea2: 'Krea 2 Raw is gated on Hugging Face.',
    flux2: 'Only FLUX.2 klein 4B is covered; the klein 9B base is gated on Hugging Face.',
  });

  static all() {
    return TrainingRecipes.RECIPES;
  }

  static byId(id) {
    return TrainingRecipes.RECIPES.find((recipe) => recipe.id === id) || null;
  }

  static forModel(model) {
    return TrainingRecipes.RECIPES.find((recipe) => ImageTrainingRegistry.matches(recipe, model)) || null;
  }

  static registryEntry(recipe) {
    const entry = { id: recipe.id, label: recipe.label, families: [...recipe.families], trainer: 'ai-toolkit' };
    if (recipe.modelIds) entry.modelIds = [...recipe.modelIds];
    return entry;
  }

  static unavailableReason(family) {
    return TrainingRecipes.GATED[family] || 'No LoRA training recipe exists for this model family yet.';
  }
}

module.exports = TrainingRecipes;
