# RpcServerBinary

`core/network-sharing/host/rpc/RpcServerBinary.js`

Finds llama.cpp's rpc-server binary for [RpcLendingService](../RpcLendingService.md).

## Methods

- `RpcServerBinary.binaryNames(platform)` `['ggml-rpc-server(.exe)', 'rpc-server(.exe)']`.
- `RpcServerBinary.resolve(llmServerService, { platform })` the first existing
  binary directly inside `<runtimesDir>/<id>`, trying the default runtime
  (`getDefaults().runtimeId`) first, then `RUNTIME_PREFERENCE`
  (`llama-cpp-cuda13`, `llama-cpp-cuda12`, `llama-cpp-vulkan`, `llama-cpp-rocm`,
  `llama-cpp-sycl`, `llama-cpp-cpu`); a ROCm or SYCL build moves ahead of Vulkan
  when the service's optional `getCachedRuntimesView()` shows its backend check
  listed a device, since a vendor build whose backend did not load would lend
  CPU compute.
  Null without a service, a runtimes dir, or a binary; never throws.

## Why

The default runtime's DLLs match the llama-server the user actually runs, so
CUDA and driver versions line up. Upstream renamed rpc-server to
ggml-rpc-server; both names keep older extracted runtimes working. The CPU
build would lend only CPU compute, so it is last.
