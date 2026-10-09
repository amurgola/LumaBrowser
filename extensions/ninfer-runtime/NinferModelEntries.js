const NinferCatalog = require('./NinferCatalog');

class NinferModelEntries {
  static hfUrl(repo, file) {
    return `https://huggingface.co/${repo}/resolve/main/${file}`;
  }

  static ENTRIES = [
    {
      id: 'qwen3.8-27b-ninfer',
      kind: 'ninfer',
      label: 'Qwen3.8 27B for NInfer (groupwise Q4/Q5)',
      blurb:
        'The Qwen3.8-27B dense model in NInfer\'s groupwise-int container: a mix '
        + 'of 4-bit and 5-bit group-64 tensors (~5.4 bits/weight, 17 GiB). On one '
        + 'RTX 5090 it decodes at ~75-80 tok/s plain and ~110-157 tok/s with MTP, '
        + 'holding up far better than llama.cpp past 64K of context. Thinking, '
        + 'tool calls, images and video are supported. Not a Q6 build: NInfer '
        + 'publishes no 6-bit artifact.',
      requiresRuntime: NinferCatalog.RUNTIME_ID,
      dir: 'ninfer',
      file: {
        url: NinferModelEntries.hfUrl('neroued/Qwen3.8-27B-NInfer', 'qwen3_8_27b.ninfer'),
        filename: 'qwen3_8_27b.ninfer',
        bytes: 18210531328,
        sha256: 'eec39564993d6e9c7d5e383382a760f093465c9d163ec9a1bd6b80199514bf3e',
      },
      hfRepo: 'neroued/Qwen3.8-27B-NInfer',
      contextLength: 262144,
      defaultContextSize: 131072,
      sidecar: { quant: 'groupwise-int (Q4G64/Q5G64, ~5.4 bpw)', modelId: 'qwen3.8-27b', weightsId: 'groupwise-int' },
    },
    {
      id: 'qwen3.8-27b-nvfp4-ninfer',
      kind: 'ninfer',
      label: 'Qwen3.8 27B for NInfer (NVFP4)',
      blurb:
        'Qwen3.8-27B in NInfer\'s mixed FP8/NVFP4 container (20 GiB): Blackwell '
        + 'tensor-core 4-bit weights with FP8 attention. Faster prefill than the '
        + 'groupwise build at shallow context and the higher-scoring quant on '
        + 'AIME in NInfer\'s own evaluation; leaves less VRAM for context.',
      requiresRuntime: NinferCatalog.RUNTIME_ID,
      dir: 'ninfer',
      file: {
        url: NinferModelEntries.hfUrl('neroued/Qwen3.8-27B-nvfp4-NInfer', 'qwen3_8_27b_nvfp4.ninfer'),
        filename: 'qwen3_8_27b_nvfp4.ninfer',
        bytes: 21492695040,
        sha256: 'bb3360522a06e136e0367f5703414d26272b7285c8a6ab6194135c17dbd81b32',
      },
      hfRepo: 'neroued/Qwen3.8-27B-nvfp4-NInfer',
      contextLength: 262144,
      defaultContextSize: 98304,
      sidecar: { quant: 'NVFP4 + FP8', modelId: 'qwen3.8-27b', weightsId: 'nvfp4' },
    },
    {
      id: 'qwen3.6-35b-a3b-ninfer',
      kind: 'ninfer',
      label: 'Qwen3.6 35B-A3B for NInfer (groupwise, MoE)',
      blurb:
        'The 35B mixture-of-experts model with 3B active parameters (21 GiB). '
        + 'NInfer\'s headline target: ~270 tok/s plain and 600-770 tok/s with '
        + 'MTP on one RTX 5090. NInfer\'s own audit found that its highest '
        + 'throughput can coincide with degenerate output on code and '
        + 'structured tasks, so treat it as a fast model, not a careful one.',
      requiresRuntime: NinferCatalog.RUNTIME_ID,
      dir: 'ninfer',
      file: {
        url: NinferModelEntries.hfUrl('neroued/Qwen3.6-35B-A3B-NInfer', 'qwen3_6_35b_a3b.ninfer'),
        filename: 'qwen3_6_35b_a3b.ninfer',
        bytes: 22783246080,
        sha256: '1fb9ea0b5b8561e49d9604115ec89e5d9f2b6f6434e32c37c57fffd480a325d2',
      },
      hfRepo: 'neroued/Qwen3.6-35B-A3B-NInfer',
      contextLength: 262144,
      defaultContextSize: 65536,
      sidecar: { quant: 'groupwise-int', modelId: 'qwen3.6-35b-a3b', weightsId: 'groupwise-int' },
    },
  ];
}

module.exports = NinferModelEntries;
