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
      speculative: {
        specType: 'draft-dflash',
        draftNMax: 7,
        label: 'DFlash2',
      },
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
    deepseek4: {
      label: 'DeepSeek V4',
      architectures: ['deepseek41', 'deepseek4'],
      namePattern: /\bdeepseek[-_ ]?v?4(?:\.\d)?\b/i,
      flags: ['--jinja'],
      nativeToolCalls: true,
      note:
        'DeepSeek V4 and V4.1 answer tool requests in DSML markup regardless of the prompt, which llama-server '
        + 'parses only through the jinja path with tools registered on the request, so tool calls are native. '
        + 'No sampler is set: DeepSeek publishes none for the 1017 release.',
    },
    gemma4: {
      label: 'Gemma 4',
      architectures: ['gemma4'],
      namePattern: /(?:^|[^a-z0-9])gemma[-_ ]?4(?![0-9])/i,
      samplerDefaults: { temperature: 1.0, top_p: 0.95, top_k: 64 },
      flags: ['--jinja'],
      nativeToolCalls: true,
      note:
        'Google publishes temperature 1.0 / top_p 0.95 / top_k 64 for Gemma 4. Tool calls are native: on the text '
        + 'fence Gemma 4 E4B sometimes wrote its own tool-call tokens as plain text or pasted the result into the '
        + 'reply (27 of 30 long tool calls worked), against 30 of 30 with tools registered through the jinja path.',
    },
    ricursive: {
      label: 'Ripple',
      architectures: ['ricursive'],
      namePattern: /\bripple[-_ ]?\d+b\b/i,
      flags: ['--jinja'],
      nativeToolCalls: false,
      note:
        'ricursiveAI Ripple (dense 65B, hybrid sliding-window attention) ships a plain ChatML template that '
        + 'llama-server renders through the jinja path; it carries no tool markup, so tools go through the text '
        + 'fence. Loads only on the LumaByte runtime (luma-b7 or later, patch 0011). No sampler is published.',
    },
  };
}

module.exports = ModelFamilyTable;
