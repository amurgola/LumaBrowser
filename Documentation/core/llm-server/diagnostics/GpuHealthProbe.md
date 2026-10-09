# GpuHealthProbe

`core/llm-server/diagnostics/GpuHealthProbe.js`

Windows GPU health. A GPU on an M.2 riser can pseudo-disconnect: present in
Device Manager but with 0 VRAM and a failed driver. This keeps it visible with
a recovery action.

## Methods

- `GpuHealthProbe.probe(gpu)` resolves `{ available: true, source: 'pnp',
  devices, total, healthyCount, faultedCount, pcieAspm }` or
  `{ available: false, reason }`. `pcieAspm` ([PcieAspm](PcieAspm.md)`.read()`)
  is fetched only when something is faulted, else null, so the UI can offer
  the durable fix without a second round trip.
- `GpuHealthProbe.classify(rows, gpu)` devices `{ instanceId, name, status,
  present, isHealthy, recoverable, invisibleToApp }`, skipping software
  adapters and rows without an instance id. Anything not `OK` (Error,
  Degraded, Unknown, Disabled) is recoverable; `invisibleToApp` marks a faulted
  card Chromium also did not list (the "visible in Task Manager, dead
  everywhere else" symptom).
