# GgufParser

`core/llm-server/GgufParser.js`

Reads the metadata header of a GGUF file (and, best-effort, its tensor-info
section) into a flat summary for the launch planner. Never throws.

## Methods

- `GgufParser.parseHeader(filePath, options)` is the entry point; it creates a
  parser and runs `parse`. `options.byteCap` (default 64 MB of reads) and
  `options.timeoutMs` (default 4000) bound the core header read.
- `new GgufParser(options).parse(filePath)` resolves to the summary built by
  `GgufHeaderSummary.build` plus `bytesRead`, `truncated: false` and
  `durationMs`. On any failure it resolves to
  `{ ok:false, error, cap, bytesRead: 0, durationMs }`; `cap` is true when the
  byte cap stopped the read.
- Constants: `DEFAULT_BYTE_CAP`, `DEFAULT_TIMEOUT_MS`, `EXTENDED_TIMEOUT_MS`
  (30 s), `MIN_FILE_BYTES`, `MAX_TENSOR_RANK`.

Collaborators: `GgufCursor` (paged reads), `GgufValueReader` (value decoding),
`GgufHeaderSummary` (key filter and result shape), `GgufTensorLayout` (tensor
scan, merge, derive).

## Why it exists

The launch planner needs the layer count to compute a real partial offload
split instead of all-GPU or all-CPU, plus the attention shape to price the KV
cache. Published GGUF libraries materialise the whole metadata blob (the
multi-MB tokenizer arrays) and some mmap tensor data. This reader keeps only
the scalars it wants, walks tokenizer arrays by their length prefixes only,
and then reads the tensor names and offsets.

## Core vs extended walk

Every wanted hyper-parameter precedes `tokenizer.*` in llama.cpp's writer
order. Seeing the first tokenizer key (or finishing the KV list) marks the core
result complete. After that point:

- the deadline is extended by 30 s, because a model rescan can share the disk
  with a running llama-server streaming a 26 GB file; a 4 s budget there once
  nulled the tensor scan for every model, and the null persisted through the
  header cache;
- any failure (byte cap, timeout, exotic layout, truncated tail) keeps the
  header-only result and records the reason in `attnScanError`.

A failure before the core is complete fails the whole parse.

## Tensor scan

Hybrid linear-attention models (the qwen35 class) interleave deltanet blocks
that keep no growing KV cache. No header key says which blocks those are, but
only full-attention blocks carry `attn_k` tensors, so the tensor names do. The
same walk sizes every tensor from its offset and detects a grafted MTP head;
see `GgufTensorLayout`.

## Worker thread use

The parse is pure `fs` + `Buffer` work with no Electron dependency, so the
model scanner runs it on a `worker_threads` worker (legacy
`core/llm-server/ggufParseWorker.js`) to keep the ~10 MB tokenizer walk off the
main event loop. When that worker is ported it should call
`require('./GgufParser').parseHeader(filePath)`.

Output was verified byte-identical (JSON) to the legacy parser on four real
model files (qwen35, qwen35moe, qwen3vl, clip mmproj).
