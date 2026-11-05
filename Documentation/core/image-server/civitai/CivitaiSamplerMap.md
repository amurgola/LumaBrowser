# CivitaiSamplerMap

`core/image-server/civitai/CivitaiSamplerMap.js`

Translates the sampler and scheduler names CivitAI carries (A1111 labels such as `DPM++ 2M Karras`, ComfyUI ids such as `dpmpp_2m_sde_gpu`, meta words such as `Schedule type: beta`) into the sampler and scheduler vocabulary sd.cpp accepts.

## Methods

- `CivitaiSamplerMap.resolve(samplerName, schedulerName?)` `{ sampler, scheduler, exact, source }` or `null` when the label is unreadable (callers keep their base default). An explicit `schedulerName` (a meta `Schedule type`) wins over a scheduler word inside the sampler label; a scheduler word alone (`Karras`) answers `sampler: null` with the scheduler. `exact` is false when either side is a stand-in. `source` echoes the inputs.
- `sampler(label)` `{ sampler, exact }` or `null`; `scheduler(label)` the sd.cpp scheduler or `null` (the runtime default, or an unknown word).
- `isSampler(name)`, `isScheduler(name)`, `normalize(label)` (lowercase, `_` and `-` to spaces, `dpmpp` to `dpm++`, `gpu` / `cpu` / `cfg++` / `sampler` / `scheduler` decorations dropped).
- `SAMPLERS` (`euler`, `euler_a`, `heun`, `dpm2`, `dpm++2s_a`, `dpm++2m`, `dpm++2mv2`, `ipndm`, `ipndm_v`, `lcm`, `ddim_trailing`, `tcd`), `SCHEDULERS` (`discrete`, `karras`, `exponential`, `ays`, `gits`, `smoothstep`, `sgm_uniform`, `simple`), `SCHEDULER_WORDS`, `SAMPLER_RULES`.

## Mapping

Exact: `Euler a` / `euler_ancestral` to `euler_a`; `Euler`; `Heun`; `DPM2`; `DPM++ 2S a`; `DPM++ 2M`; `DPM++ 2M v2`; `iPNDM`, `ipndm_v`; `LCM`; `TCD`; `DDIM trailing`; scheduler words `Karras`, `Exponential`, `SGM Uniform`, `Simple`, `Align Your Steps` / `AYS`, `GITS`, `Smoothstep`; `Normal`, `Automatic`, `Discrete` mean the runtime default.

Stand-ins (`exact: false`): every SDE variant (`DPM++ SDE`, `DPM++ 2M SDE`, `DPM++ 3M SDE`, with or without `Heun`, `GPU`, `CFG++`), `DPM++ 3M`, `UniPC`, `DEIS`, `Res Multistep`, `DPM fast` / `adaptive` to `dpm++2m`; `DPM2 a` to `dpm2`; `LMS`, `PLMS`, `Restart`, `ER SDE` to `euler`; `DDIM` to `ddim_trailing`; `heunpp2` to `heun`; the `Beta` schedule to `sgm_uniform`; `KL Optimal` and `Uniform` to the runtime default.

## Why

sd.cpp has no stochastic (SDE) samplers, no UniPC and no beta schedule, yet most CivitAI recipes name one of them. A stand-in keeps the creator's step count and cfg usable while `exact: false` lets the defaults derivation note the substitution instead of presenting it as the creator's recipe. The beta stand-in follows the [ImportBases](../ipc/ImportBases.md) note: sd.cpp silently falls back from an unknown scheduler and warbles flat regions, while `sgm_uniform` is valid and clean.
