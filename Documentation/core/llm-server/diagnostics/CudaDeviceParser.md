# CudaDeviceParser

`core/llm-server/diagnostics/CudaDeviceParser.js`

Parses nvidia-smi's per-GPU CSV query and its XML CUDA version.

## Methods

- `CudaDeviceParser.QUERY_ARGS` the `--query-gpu=...` arguments (name, driver,
  memory total/free/used, compute capability, PCIe gen and width current/max,
  PCI device id, bus id; CSV, no header, no units). `VERSION_ARGS` is
  `['--query', '-x']`.
- `CudaDeviceParser.parseDevices(stdout)` one device per line:
  `{ name, driverVersion, memoryTotalMB, memoryFreeMB, memoryUsedMB,
  computeCapability, pcie, pciDeviceId, pciBusId }`; `pcie` is null when all
  four link fields are missing.
- `CudaDeviceParser.parsePciDeviceId(text)` `0xDDDDVVVV` to
  `{ deviceId, vendorId }`, or null.
- `CudaDeviceParser.parseCudaVersion(xml)` the `<cuda_version>` text, or null.
