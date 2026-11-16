class TrainingConfig {
  static PROCESS_TYPE = 'sd_trainer';
  static DEFAULT_RANK = 32;
  static SAVES_PER_RUN = 4;
  static SAVE_STEP_GRID = 50;
  static MIN_SAVE_EVERY = 250;

  static TRAIN_DEFAULTS = Object.freeze({
    batch_size: 1,
    bypass_guidance_embedding: true,
    gradient_accumulation: 1,
    train_unet: true,
    train_text_encoder: false,
    gradient_checkpointing: true,
    noise_scheduler: 'flowmatch',
    optimizer: 'adamw8bit',
    timestep_type: 'sigmoid',
    content_or_style: 'balanced',
    optimizer_params: { weight_decay: 1e-4 },
    unload_text_encoder: false,
    cache_text_embeddings: false,
    lr: 1e-4,
    ema_config: { use_ema: false, ema_decay: 0.99 },
    dtype: 'bf16',
    loss_type: 'mse',
    skip_first_sample: true,
    disable_sampling: true,
  });

  static MODEL_DEFAULTS = Object.freeze({
    quantize: true, qtype: 'qfloat8', quantize_te: true, qtype_te: 'qfloat8', low_vram: false, model_kwargs: {}, compile: false,
  });

  static DATASET_DEFAULTS = Object.freeze({
    caption_ext: 'txt', caption_dropout_rate: 0.05, cache_latents_to_disk: true, resolution: [512, 768, 1024],
  });

  static SAMPLE_DEFAULTS = Object.freeze({
    sampler: 'flowmatch', sample_every: 250, width: 1024, height: 1024, seed: 42, walk_seed: true, guidance_scale: 4, sample_steps: 25,
  });

  static build({ recipe, job, datasetDir, outputDir, basePath }) {
    const steps = job.steps || recipe.steps;
    return {
      job: 'extension',
      config: {
        name: job.name,
        process: [{
          type: TrainingConfig.PROCESS_TYPE,
          training_folder: outputDir,
          device: 'cuda',
          trigger_word: job.trigger,
          network: TrainingConfig._network(recipe, job.rank),
          save: TrainingConfig._save(steps),
          datasets: [{ folder_path: datasetDir, ...TrainingConfig.DATASET_DEFAULTS, ...(recipe.dataset || {}) }],
          train: { ...TrainingConfig.TRAIN_DEFAULTS, steps, ...(recipe.train || {}) },
          model: { name_or_path: basePath, arch: recipe.arch, ...TrainingConfig.MODEL_DEFAULTS, ...(recipe.model || {}) },
          sample: { ...TrainingConfig.SAMPLE_DEFAULTS, ...(recipe.sample || {}), samples: [{ prompt: job.trigger }] },
        }],
      },
      meta: { name: '[name]', version: '1.0' },
    };
  }

  static _network(recipe, rank) {
    const fromRecipe = recipe.network || {};
    const linear = rank || fromRecipe.linear || TrainingConfig.DEFAULT_RANK;
    return { type: 'lora', ...fromRecipe, linear, linear_alpha: rank ? rank : (fromRecipe.linear_alpha || linear) };
  }

  static _save(steps) {
    const grid = TrainingConfig.SAVE_STEP_GRID;
    const every = Math.max(TrainingConfig.MIN_SAVE_EVERY, Math.ceil(steps / TrainingConfig.SAVES_PER_RUN / grid) * grid);
    return { dtype: 'float16', save_every: every, max_step_saves_to_keep: 2, push_to_hub: false };
  }
}

module.exports = TrainingConfig;
