# HostIsa

`extensions/ik-llama-runtime/HostIsa.js`

Decides which x64 instruction-set level of the ik_llama.cpp builds this host
can run. The level is baked into the asset regexes once per host.

## Methods

- `HostIsa.detect({ platform?, env?, cpuModel?, cpuinfo? })` returns
  `{ isa, source, detail }`; first hit wins:
  1. `LUMA_IK_LLAMA_ISA` when it is one of `VARIANTS` (case-insensitive) -> `source: 'env'`;
  2. on Linux, the `flags` line of `/proc/cpuinfo` (or `cpuinfo`) -> `'cpuinfo'`;
  3. the CPU model string (`cpuModel` or `os.cpus()[0].model`) through
     [CpuModelIsa](CpuModelIsa.md) -> `'model-name'`;
  4. `{ isa: 'avx2', source: 'default' }`.
- `HostIsa.fromCpuFlags(flags)` (Set or array): no `avx512f` -> `avx2`; no
  `avx512_vnni` -> `avx512`; else `avx512_vnni` plus `_vbmi` (`avx512vbmi` or
  `avx512_vbmi`) and `_bf16` (`avx512_bf16`).
- Statics: `VARIANTS` (weakest first), `ENV_OVERRIDE`, `CPUINFO_PATH`.

## Why

A wrong guess is not a slow binary but an "illegal instruction" crash at
launch, so everything unrecognised gets avx2. An unknown override falls through
instead of failing, so a typo cannot make the runtime uninstallable; a wrong
guess can always be overridden or worked around with Locate. A cpuinfo without
a flags line (some containers) falls through to the model name. Apple Silicon
has a single build, so the value is unused there.
