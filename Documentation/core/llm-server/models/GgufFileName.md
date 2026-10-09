# GgufFileName

`core/llm-server/models/GgufFileName.js`

Reads what a GGUF file name encodes: quant, shard position, and whether the
file is a companion (vision projector, imatrix, detached MTP head) rather than
model weights.

## Methods

- `GgufFileName.quantOf(basename)` returns the uppercased quant token at the
  end of the shard-stripped stem (`Q4_K_M`, `IQ4_XS`, `F16`, `BF16`, `MXFP4`,
  `TQ1_0`, ...) or `null`.
- `GgufFileName.split(basename)` returns `{ stem, shard }` where `shard` is
  `{ i, n }` for `...-00002-of-00003.gguf`, else `null`.
- `GgufFileName.shardIndex(repoPath)` returns the part number, or 0.
- `GgufFileName.isMtpHead(repoPath)` is true for a detached MTP head.
- `GgufFileName.isMmproj(basename)`, `GgufFileName.isImatrix(basename)`.
- `GgufFileName.projectorPrecision(basename)` returns `F16`, `BF16`, `Q8_0`,
  ... or `null`.
- `GgufFileName.bitWidth(quant)` returns the first number in a quant, or `null`.
- `GgufFileName.isGguf(path)`, `GgufFileName.basename(repoPath)`.

## Why detached MTP heads are matched narrowly

Two conventions ship Multi-Token-Prediction heads. The older one grafts the
head into every quant and stamps "MTP" into the weights' name
(`Qwen3.6-27B-Q4_K_M-mtp.gguf`); those files ARE the model. The newer one
(first seen on unsloth/Qwen3.8-27B-GGUF) publishes the head once as its own
~1.4 GB GGUF, `MTP/mtp-Qwen3.8-27B-Q4_0.gguf`, shared by every quant. That file
ends in a real quant token, so without detection it registers as a bogus
"Q4_0" colliding with the 16 GB weights. Only an `mtp-`/`mtp_` basename prefix
or a top-level `MTP/` folder counts; a bare "mtp" anywhere else does not.
