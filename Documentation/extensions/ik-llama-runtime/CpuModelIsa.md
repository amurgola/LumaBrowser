# CpuModelIsa

`extensions/ik-llama-runtime/CpuModelIsa.js`

Guesses the AVX-512 level from a CPU model string, the only cheap signal on
Windows and macOS, where Node exposes no feature flags.

## Methods

- `CpuModelIsa.fromModelName(model)` returns an ISA variant name:
  - AMD Threadripper 7xxx/9xxx, Ryzen 7xxx/8xxx/9xxx (except Mendocino 7x20,
    which is Zen 2), Ryzen AI, EPYC 9xx4/9xx5 -> `avx512_vnni_vbmi_bf16` (`FULL`);
  - Intel Xeon w-series, Platinum/Gold/Silver/Bronze x4xx and up, Xeon 6 ->
    `FULL`; x3xx (Ice Lake SP) -> `avx512_vnni_vbmi`; x2xx (Cascade Lake) ->
    `avx512_vnni`; x1xx (Skylake-SP) -> `avx512`;
  - Intel Core 11th gen -> `avx512_vnni_vbmi`; Core X 10xxxX -> `avx512_vnni`;
    Core X 7/9xxxX -> `avx512`;
  - anything else (including 12th gen and later, and Apple) -> `avx2`.
- `CpuModelIsa.FULL`.
