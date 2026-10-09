# ImageLaunchPlanner

`core/image-server/server/ImageLaunchPlanner.js`

Plans the sd-server (stable-diffusion.cpp) argv for an installed image or video
model on a runtime. Pure, no I/O. Extends `MediaLaunchPlanner`.

## Methods

- `new ImageLaunchPlanner().plan({ model, runtime, diagnostics?, port, publicPort?, overrides? })`
  returns `{ binaryPath, args, plan }`.
  - `plan = { port (publicPort when given, else port), privatePort, modelId,
    runtimeId, offloadToCpu, autoFit, vaeTiling, flashAttention, files: { role: basename } }`.
  - Throws `ImageLaunchPlanner: model is required`, `runtime is required`,
    `runtime has no binaryPath`, `port is required` (must be a number),
    `model.files.diffusion.path is required`.
  - `overrides`: `offloadToCpu`, `autoFit` (true or a `--max-vram` budget
    string), `autoFitForm` ('bare' for pre-on|off builds), `vaeTiling`,
    `loraDir`, `clipOnCpu` (false drops the catalog's `--clip-on-cpu`).
- `ImageLaunchPlanner.inferLoaderFlag(filePath)` is `--diffusion-model` for
  `.gguf`, else `-m`.
- `ImageLaunchPlanner.preferSdServer(binaryPath)` keeps an `sd-server*` path,
  otherwise returns the `sd-server[.exe]` sibling.
- Statics: `GIB`, `HOST`, `FILE_ROLE_FLAGS`, `PERFORMANCE_FLAGS`.

## Argv order

1. `<loaderFlag> <diffusion> --listen-ip 127.0.0.1 --listen-port <port> -v`
2. File roles: `--high-noise-diffusion-model`, `--vae`, `--audio-vae`*, `--llm`,
   `--clip_l`, `--t5xxl`, `--llm_vision`*, `--clip_vision`* (* the role's own
   `loaderFlag` wins).
3. `--diffusion-fa --diffusion-conv-direct --vae-conv-direct` unless the runtime
   lists them in `unsupportedFlags`.
4. `--vae-tiling` (override), `--lora-model-dir <dir>` (override).
5. `--auto-fit on [--max-vram <budget>]`, or `--offload-to-cpu`, never both.
6. The model's `launchArgs`, then the runtime's `extraArgs` (last, so they win).

## Why

- Loader flag: `.gguf` is always UNet-only (Flux, Z-Image, SD3), so it pairs with
  `--diffusion-model` plus separate VAE and encoders; `.safetensors` / `.ckpt` is
  the single-file checkpoint shape (SD 1.5, SDXL, Pony). Catalog rows and import
  manifests can pin `loaderFlag`. A wrong guess makes sd-server exit with
  "invalid parameter" on first launch.
- sd-server uses `--listen-ip` / `--listen-port`, not llama-server's `--host` /
  `--port`. The child binds loopback only because it has no auth flag; the
  `AuthProxy` serves the public port.
- The detector may return sd-cli (first on the binary list); sd-server lives next
  to it in every bundle.
- Flash attention and direct conv2d are measured wins on every supported CUDA and
  Vulkan build.
- VAE tiling keeps an edit model's reference encode small (un-tiled wan_vae is
  7 to 8 GB, the "failed to encode reference image 0" OOM), so it stays resident.
- The LoRA folder backs each request's structured `lora` list; prompt `<lora:>`
  tags are ignored by the server APIs.
- Auto-fit spreads modules across GPUs from real tensor sizes (how MiniMax-H3's
  35 GB bag runs resident on a multi-GPU box). Upstream changed it from a bare
  switch to `--auto-fit on|off`; the bare form makes the parser eat `--max-vram`
  as its value and exit 1, so `on` is the default and the service probes for the bare form.
- The offload heuristic streams weights from RAM when known usable VRAM
  (`diagnostics.budget.vram.maxBytes`, else `totalBytes`) is below the model's
  `minVramBytes`. Unknown VRAM is not zero VRAM, so it does not fire then.
- Video roles: `highNoise` is Wan 2.2's second expert (early steps); `audioVae`
  decodes the audio latent of audio-video models (MiniMax-H3); `vision` is an
  edit model's vision projector for reference images; `clipVision` conditions
  Wan I2V / first-last-frame requests.
