class LoraTrainerTools {
  static NOT_READY = 'The LoRA trainer is not active.';

  static STARTED = 'The pictures are captioned and training has started in the background. Tell the user it is running and roughly how long it takes; '
    + 'do not wait for it. The chat shows its progress above the message box and the result is posted into this conversation when it ends. '
    + 'Use lora_training_status when they ask how it is going.';

  static TOOLS = [
    {
      name: 'train_lora',
      mutating: true,
      description:
        'Train a LoRA that teaches an installed image model a character, object or style from the user\'s own '
        + 'pictures. Captions the pictures first (this call waits for that, up to a few minutes), then trains in '
        + 'the background and returns; training takes from about twenty minutes to a few hours and uses the '
        + 'graphics card, so image generation is stopped while it runs. The first run also '
        + 'downloads the trainer (several GB) and, for some models, training weights. Needs at least 4 pictures; '
        + '10 to 30 varied ones work best. Check on it with lora_training_status.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short name for the LoRA, e.g. "mira_character". Becomes its file name.' },
          images: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ids of pictures in this chat to train on (the artifact catalog lists attached and generated pictures as art_...).',
          },
          imageFolder: { type: 'string', description: 'Alternative to images: a folder on this computer holding PNG or JPEG pictures.' },
          imagePaths: { type: 'array', items: { type: 'string' }, description: 'Alternative to images: full paths of PNG or JPEG files.' },
          model: { type: 'string', description: 'Id or name of the installed image model to train for (see lora_training_status). Default: the image generation default.' },
          subject: { type: 'string', description: 'A few words on what the pictures show, e.g. "a woman with short red hair" or "watercolour style". Improves the captions.' },
          trigger: { type: 'string', description: 'The word that will call the subject up in prompts. Default: the name.' },
          steps: { type: 'number', description: 'Training steps. Leave out for the model\'s usual count.' },
          rank: { type: 'number', description: 'LoRA rank (size), 4 to 128. Leave out unless the user asks.' },
          applyWhenDone: { type: 'boolean', description: 'true to attach the finished LoRA to the model automatically.' },
        },
        required: ['name'],
      },
    },
    {
      name: 'lora_training_status',
      description:
        'Report on LoRA training: the running or latest job (phase, step counts, time left, errors), recent jobs, '
        + 'which installed image models can be trained, and the LoRAs trained so far with their trigger words.',
      inputSchema: {
        type: 'object',
        properties: { jobId: { type: 'string', description: 'A job id from train_lora. Default: the running or latest job.' } },
      },
    },
    {
      name: 'cancel_lora_training',
      mutating: true,
      description: 'Stop the running LoRA training job. Its working files are deleted; nothing is added to the library.',
      inputSchema: {
        type: 'object',
        properties: { jobId: { type: 'string', description: 'A job id from train_lora. Default: the running job.' } },
      },
    },
    {
      name: 'apply_lora',
      mutating: true,
      description:
        'Attach a LoRA from the library to an installed image model of the family it was trained for, so every '
        + 'image that model makes uses it; prompts must contain its trigger word. Refuses a model of another '
        + 'family. Set remove to detach it again.',
      inputSchema: {
        type: 'object',
        properties: {
          lora: { type: 'string', description: 'Name of the LoRA (see lora_training_status).' },
          model: { type: 'string', description: 'Id or name of the image model. Default: the model the LoRA was trained for.' },
          weight: { type: 'number', description: 'Strength, 0.05 to 2. Default 1.' },
          remove: { type: 'boolean', description: 'true to detach the LoRA from the model instead.' },
        },
        required: ['lora'],
      },
    },
  ];

  constructor() {
    this._services = null;
  }

  bind(services) {
    this._services = services || null;
  }

  async handle(toolName, args, opts = null) {
    if (!this._services) return LoraTrainerTools._error(LoraTrainerTools.NOT_READY);
    try {
      return LoraTrainerTools._json({ success: true, ...(await this._route(toolName, args || {}, opts || {})) });
    } catch (err) {
      return LoraTrainerTools._error(err.message);
    }
  }

  async _route(toolName, args, opts) {
    const { flow, overview, applier } = this._services;
    if (toolName === 'train_lora') return { job: await flow.start(args, LoraTrainerTools.controls(opts)), message: LoraTrainerTools.STARTED };
    if (toolName === 'lora_training_status') return overview.describe(args.jobId || null);
    if (toolName === 'cancel_lora_training') return { job: flow.cancel(args.jobId || null) };
    if (toolName === 'apply_lora') {
      return applier.apply({ loraName: args.lora, modelRef: args.model || null, weight: args.weight, remove: args.remove === true });
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }

  static controls(opts) {
    return {
      isAborted: opts.chat && typeof opts.chat.isAborted === 'function' ? opts.chat.isAborted : null,
      onProgress: typeof opts.onProgress === 'function' ? opts.onProgress : null,
      conversationId: (opts.chat && opts.chat.conversationId) || null,
    };
  }

  static _json(payload) {
    return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
  }

  static _error(message) {
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }], isError: true };
  }
}

module.exports = LoraTrainerTools;
