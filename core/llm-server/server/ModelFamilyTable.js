class ModelFamilyTable {
  static SAMPLER_CLI = {
    temperature: '--temp',
    top_p: '--top-p',
    top_k: '--top-k',
    min_p: '--min-p',
    repeat_penalty: '--repeat-penalty',
    presence_penalty: '--presence-penalty',
  };

  static FAMILIES = {
    'muse-glimmer': {
      label: 'Muse Glimmer',
      architectures: ['muse-glimmer', 'muse_glimmer', 'museglimmer'],
      namePattern: /\bmuse[-_ ]?glimmer\b/i,
      samplerDefaults: { temperature: 1.0, top_p: 0.95, top_k: 64, repeat_penalty: 1.0 },
      penaltyHostile: true,
      flags: ['--jinja', '--reasoning-preserve'],
      speculative: {
        specType: 'draft-dflash',
        draftNMax: 15,
        label: 'DFlash',
      },
      note:
        'Meta publishes temperature 1.0 / top_p 0.95 / top_k 64 for this model; its tool-call '
        + 'template needs llama.cpp\'s jinja path, and llama-server asks for --reasoning-preserve '
        + 'so every step of an agent loop re-renders history with its reasoning intact.',
    },
    qwen38: {
      label: 'Qwen3.8',
      architectures: [],
      namePattern: /\bqwen[-_ ]?3\.8\b/i,
      samplerDefaults: {
        temperature: 1.0, top_p: 0.95, top_k: 20, min_p: 0.0,
        repeat_penalty: 1.0, presence_penalty: 0.0,
      },
      flags: ['--jinja', '--reasoning-preserve'],
      nativeToolCalls: false,
      nativeToolCallsCapable: true,
      nativeToolExclude: ['edit_artifact'],
      note:
        'Alibaba publishes temperature 1.0 / top_p 0.95 / top_k 20 / min_p 0.0 with both penalties '
        + 'off for Qwen3.8; its tool-call template needs the jinja path in llama.cpp, and llama-server '
        + 'asks for --reasoning-preserve so every step of an agent loop re-renders history with its '
        + 'reasoning intact.',
    },
    'qwen38-flash-next': {
      label: 'Qwen3.8 Flash Next',
      architectures: ['qwen4exp', 'qwen4_exp'],
      samplerDefaults: {
        temperature: 1.0, top_p: 0.95, top_k: 20, min_p: 0.0,
        repeat_penalty: 1.0, presence_penalty: 0.0,
      },
      flags: ['--jinja', '--reasoning-preserve'],
      nativeToolCalls: false,
      nativeToolCallsCapable: true,
      kvQuantUnsafe: true,
      ngramSpec: true,
      note:
        'Alibaba publishes temperature 1.0 / top_p 0.95 / top_k 20 / min_p 0.0 with penalties off for '
        + 'Qwen3.8 Flash Next (thinking mode); tool calls need the jinja path and the template preserves '
        + 'reasoning across turns. Its sparse attention corrupts output on a quantized KV cache, so the KV '
        + 'cache is kept at f16.',
    },
  };
}

module.exports = ModelFamilyTable;
