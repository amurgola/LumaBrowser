const BasaltCatalog = require('./BasaltCatalog');

class BasaltModelEntries {
  static KiB = 1024;
  static MiB = 1024 * 1024;

  static hfUrl(repo, file) {
    return `https://huggingface.co/${repo}/resolve/main/${file}`;
  }

  static ENTRIES = [
    {
      id: 'qwen3.8-27b-basalt',
      kind: 'basalt',
      label: 'Qwen3.8 27B for Basalt (NVFP4)',
      blurb:
        'The dense Qwen3.8-27B from QUASAR\'s quantization-aware NVFP4 checkpoint, with the DFlash 2 block '
        + 'drafter (21 GB). 16 GiB of it sits on the card and 2.4 GiB in page-locked RAM. On one RTX 5090 at '
        + '32K it decoded at about 206 to 279 tok/s drafted and read prompts at about 13,000 to 15,000 tok/s; '
        + 'the 8-bit KV cache holds the full 262,144 tokens. Thinking, tool calls and images are supported.',
      requiresRuntime: BasaltCatalog.RUNTIME_IDS,
      dir: 'basalt',
      file: {
        url: BasaltModelEntries.hfUrl('jesdga/Qwen3.8-27B-Basalt', 'Qwen3.8-27B-QUASAR-NVFP4.basalt'),
        filename: 'Qwen3.8-27B-QUASAR-NVFP4.basalt',
        bytes: 21149505930,
        sha256: '5ec89e71b4bd461a5abf607825d3cd99e74d2476b8ba087fd690f09a067919ba',
      },
      hfRepo: 'jesdga/Qwen3.8-27B-Basalt',
      contextLength: 262144,
      defaultContextSize: 131072,
      sidecar: { quant: 'NVFP4 (QUASAR QAT)', modelId: 'qwen3.8-27b' },
      basalt: {
        packPattern: '^Qwen3\\.8-27B-',
        family: 'qwen38',
        vision: true,
        sizing: 'card',
        cardFixedBytes: 18 * 1024 * BasaltModelEntries.MiB,
        slotStateBytes: 157 * BasaltModelEntries.MiB,
        kv: { default: 'int8', formats: { fp16: 64 * BasaltModelEntries.KiB, int8: 33 * BasaltModelEntries.KiB } },
      },
    },
    {
      id: 'qwen3.8-flash-next-basalt',
      kind: 'basalt',
      label: 'Qwen3.8 Flash Next for Basalt (NVFP4, DQ6_K)',
      blurb:
        'Qwen3.8 Flash Next, the mixture-of-experts model (132 GB): NVIDIA\'s NVFP4 experts with 6-bit dense '
        + 'projections, Basalt\'s default pack. The card holds the most routed experts and system RAM the rest, '
        + 'so it wants well over 100 GB of free RAM. MTP drafting, thinking, tool calls and images.',
      requiresRuntime: BasaltCatalog.RUNTIME_IDS,
      dir: 'basalt',
      file: {
        url: BasaltModelEntries.hfUrl('jesdga/Qwen3.8-Flash-Next-Basalt', 'Qwen3.8-FN-NVFP4-DQ6_K.basalt'),
        filename: 'Qwen3.8-FN-NVFP4-DQ6_K.basalt',
        bytes: 131681979197,
        sha256: '177f9b70c63ecd7efd17fc705ad85a8c8253d59e4f04dd10a001b556d15fad33',
      },
      hfRepo: 'jesdga/Qwen3.8-Flash-Next-Basalt',
      contextLength: 262144,
      defaultContextSize: 131072,
      sidecar: { quant: 'NVFP4 experts, Q6_K dense', modelId: 'qwen3.8-flash-next' },
      basalt: {
        packPattern: '^Qwen3\\.8-FN-',
        family: 'qwen38-flash-next',
        vision: true,
        sizing: 'engine',
        kv: { default: 'fp16', formats: { fp16: null, int8: null, q4_0: null, k8v4: null }, parallel: 'int8' },
      },
    },
    {
      id: 'deepseek-v4.1-flash-basalt',
      kind: 'basalt',
      label: 'DeepSeek V4.1 Flash 1017 for Basalt (UD-IQ1_M)',
      blurb:
        'DeepSeek-V4.1-Flash (1017 release) from Unsloth\'s UD-IQ1_M GGUF (260 GB), Basalt\'s default DeepSeek '
        + 'pack. The card holds the most routed experts, RAM what fits and the SSD the rest, so decode speed '
        + 'follows how much of it RAM holds. DSpark drafting, DSML tool calls, thinking and images.',
      requiresRuntime: BasaltCatalog.RUNTIME_IDS,
      dir: 'basalt',
      file: {
        url: BasaltModelEntries.hfUrl('jesdga/DeepSeek-V4.1-Flash-1017-Basalt', 'DeepSeek-V4.1-Flash-1017-UD-IQ1_M.basalt'),
        filename: 'DeepSeek-V4.1-Flash-1017-UD-IQ1_M.basalt',
        bytes: 259973824987,
        sha256: '1cd706a3de0dca2623e7461c9eb2f4c916aa26a3ad9e3d90ee10e5730f8ae942',
      },
      hfRepo: 'jesdga/DeepSeek-V4.1-Flash-1017-Basalt',
      contextLength: 1048576,
      defaultContextSize: 131072,
      sidecar: { quant: 'UD-IQ1_M', modelId: 'deepseek-v4.1-flash' },
      basalt: {
        packPattern: '^DeepSeek-V4\\.1-Flash',
        family: 'deepseek4',
        vision: true,
        sizing: 'engine',
        kv: { default: 'fp8', formats: { fp8: 920, fp16: 3200 } },
      },
    },
    {
      id: 'hy4-flash-basalt',
      kind: 'basalt',
      label: 'Hy4-flash for Basalt (NVFP4)',
      blurb:
        'Tencent\'s Hy4-flash mixture-of-experts model (159 GB): NVFP4 experts with Q8_0 projections, the '
        + 'vision projector and the DFly2 drafter. The card holds the dense weights and the most routed experts; '
        + 'system RAM holds the rest (78 GiB of routed experts), so it wants a large RAM.',
      requiresRuntime: BasaltCatalog.RUNTIME_IDS,
      dir: 'basalt',
      file: {
        url: BasaltModelEntries.hfUrl('jesdga/Hy4-flash-Basalt', 'Hy4-flash-NVFP4.basalt'),
        filename: 'Hy4-flash-NVFP4.basalt',
        bytes: 158746168309,
        sha256: 'f719c779ed92235e74c40cbb5b1555d6007cf51c073d43ca8ff4eb7e9b340178',
      },
      hfRepo: 'jesdga/Hy4-flash-Basalt',
      contextLength: 1048576,
      defaultContextSize: 131072,
      sidecar: { quant: 'NVFP4 experts, Q8_0 projections', modelId: 'hy4-flash' },
      basalt: {
        packPattern: '^Hy4-flash',
        family: null,
        vision: true,
        sizing: 'engine',
        kv: { default: 'fp16', formats: { fp16: 14600, fp8: 8600 } },
      },
    },
    {
      id: 'inkling-2-mini-basalt',
      kind: 'basalt',
      label: 'Inkling 2 Mini for Basalt (NVFP4, DQ8)',
      blurb:
        'Thinking Machines Lab\'s Inkling 2 Mini (20 GB): the release\'s NVFP4 experts with Q8_0 projections, its '
        + 'vision encoder and the DSpark drafter. 16.3 GiB sits on the card; when a long context needs the room the '
        + 'least routed experts move to page-locked RAM. JSON tool calls, thinking and images.',
      requiresRuntime: BasaltCatalog.RUNTIME_IDS,
      dir: 'basalt',
      file: {
        url: BasaltModelEntries.hfUrl('jesdga/Inkling-2-Mini-Basalt', 'Inkling-2-Mini-NVFP4-DQ8.basalt'),
        filename: 'Inkling-2-Mini-NVFP4-DQ8.basalt',
        bytes: 19734300551,
        sha256: 'f7b4e5f8e17681c4735a7dfc51ffd8e805c44184fad4e1778b13187d79dc3787',
      },
      hfRepo: 'jesdga/Inkling-2-Mini-Basalt',
      contextLength: 1048576,
      defaultContextSize: 131072,
      sidecar: { quant: 'NVFP4 experts, Q8_0 projections', modelId: 'inkling-2-mini' },
      basalt: {
        packPattern: '^Inkling-2-Mini',
        family: 'inkling2',
        vision: true,
        sizing: 'engine',
        kv: { default: 'fp16', formats: { fp16: 32 * BasaltModelEntries.KiB, fp8: 16 * BasaltModelEntries.KiB } },
      },
    },
  ];

  static forModel(model) {
    const addonId = model && model.addon && model.addon.id;
    const fileName = String((model && Array.isArray(model.weights) && model.weights[0] && model.weights[0].name) || '');
    const entries = BasaltModelEntries.ENTRIES;
    return entries.find((e) => addonId && e.id === addonId)
      || entries.find((e) => fileName && e.file.filename === fileName)
      || entries.find((e) => fileName && new RegExp(e.basalt.packPattern, 'i').test(fileName))
      || null;
  }
}

module.exports = BasaltModelEntries;
