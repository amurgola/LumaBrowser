# NinferModelEntries

`extensions/ninfer-runtime/NinferModelEntries.js`

The Qwen NInfer artifacts offered as one-click add-on models.

## Statics

- `NinferModelEntries.ENTRIES`: `qwen3.8-27b-ninfer` (groupwise Q4/Q5, 17 GiB),
  `qwen3.8-27b-nvfp4-ninfer` (NVFP4 + FP8, 20 GiB), `qwen3.6-35b-a3b-ninfer`
  (MoE, 21 GiB). Each has `kind: 'ninfer'`, `requiresRuntime: 'ninfer'`,
  `dir: 'ninfer'`, a Hugging Face `file` (url, filename, bytes, sha256),
  `hfRepo`, `contextLength` 262144, a `defaultContextSize` and a `sidecar`
  (`quant`, `modelId`, `weightsId`). `sidecar.modelId` becomes the server's
  `--model-id`.
- `NinferModelEntries.hfUrl(repo, file)` builds the `resolve/main` URL.
