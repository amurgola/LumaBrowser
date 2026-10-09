# NinferDevicePicker

`extensions/ninfer-runtime/NinferDevicePicker.js`

Picks the CUDA device NInfer runs on.

## Methods

- `NinferDevicePicker.pick(manifest, diagnostics)` returns `{ index, vramBytes, name }`:
  - WSL manifest: the install-time probe (`cudaDevice`, `vramBytes`, `gpuName`);
  - otherwise the first `diagnostics.cuda.devices` entry named `RTX 5090`
    (index in that list, `memoryTotalMB` in bytes);
  - else the manifest's `cudaDevice` when set;
  - else all null (the server picks device 0).

## Why

Inside the WSL VM the ordinal from the install probe is the truth; natively the
live diagnostics are fresher.
