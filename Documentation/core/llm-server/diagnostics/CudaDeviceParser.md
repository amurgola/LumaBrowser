# CudaDeviceParser

`core/llm-server/diagnostics/CudaDeviceParser.js`

Parses nvidia-smi's per-GPU CSV query and its XML CUDA version.

## Methods

- `CudaDeviceParser.QUERY_ARGS` the `--query-gpu=...` arguments (name, driver,
  memory total/free/used, compute capability, PCIe gen and width current/max,
  PCI device id, bus id; CSV, no header, no units). `VERSION_ARGS` is
  `['--query', '-x']`.
- `CudaDeviceParser.parseDevices(stdout)` one device per CUDA GPU line:
  `{ name, driverVersion, memoryTotalMB, memoryFreeMB, memoryUsedMB,
  computeCapability, pcie, pciDeviceId, pciBusId }`; `pcie` is null when all
  four link fields are missing, `computeCapability` null unless it reads
  `major.minor`. Rows that fail `isCudaGpu` are dropped.
- `CudaDeviceParser.isCudaGpu(device)` true when the row has a compute
  capability or a memory total.
- `CudaDeviceParser.parsePciDeviceId(text)` `0xDDDDVVVV` to
  `{ deviceId, vendorId }`, or null.
- `CudaDeviceParser.parseCudaVersion(xml)` the `<cuda_version>` text, else
  `<cuda_umd_version>`, or null.

## Why

Driver R620+ lists non-GPU NVIDIA devices too: the RTX Spark N1X's NPU
(`NVIDIA NPU`, UUID `DLA-...`) shows up as a second row with every field
`[N/A]`. CUDA never enumerates it, so keeping it made a one-GPU host look like
two cards and stopped the live free-memory overlay from ever matching. A
unified-memory GPU (GB10) can report no memory total, so the test is "has a
compute capability or a memory total", not memory alone. The same drivers
deprecate `<cuda_version>` in favour of `<cuda_umd_version>` (removal is
announced for CUDA 14), hence the fallback.
