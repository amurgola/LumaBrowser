# HelperModelSettings

`core/llm-server/helper/HelperModelSettings.js`

The helper model's persisted settings: enable (off by default), the GGUF
path, the card and the window.

## Methods

- Keys: `core.llmServer.helper.enabled`, `core.llmServer.helper.modelPath`,
  `core.llmServer.helper.cudaDevice` (a `CUDA_VISIBLE_DEVICES` value; unset
  means automatic, an empty string every card), `core.llmServer.helper.contextSize`
  (default 8192, clamped to 2048 to 65536).
- `isEnabled()`, `setEnabled(v)` (off deletes the key); `modelPath()`,
  `setModelPath(p)`; `cudaDevice()` (undefined automatic, null every card,
  else the string), `setCudaDevice(v)`; `contextSize()`, `setContextSize(n)`;
  `isModelInstalled()`; `modelStem()` the file name without `.gguf`, the
  `helper::` ref's stem.
- `snapshot()` `{ enabled, modelPath, cudaDevice: '' | 'all' | device, contextSize }`
  for the defaults payload; `apply(patch)` writes only the present fields
  (`cudaDevice` '' or 'auto' automatic, 'all' every card).
