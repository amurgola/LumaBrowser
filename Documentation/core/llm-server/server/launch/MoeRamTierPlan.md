# MoeRamTierPlan

`core/llm-server/server/launch/MoeRamTierPlan.js`

The locked RAM tier and the expert use profile of an expert offload whose pool
does not fit RAM, for the LumaByte runtime luma-b5 or newer (`--moe-ram-mib`,
`--moe-profile`).

## Methods

- `MoeRamTierPlan.resolve({ flags, loading, moe, overrides, files, budget })` returns
  `{ enabled, bytes, mib, reason, profilePath, registerMib, registerCards }`.
  - On: `bytes` is the smaller of the expert pool and `RAM_SHARE` (0.5) of system
    RAM, rounded down to whole MiB; [LaunchArgsBuilder](LaunchArgsBuilder.md)
    emits it as `--moe-ram-mib`.
  - Off, with `reason` in this order: no expert offload; the runtime has no tier
    (`flags.moeTiers` false: mainline, or luma-b4 and older); `overrides.noMoeRamTier`;
    the pool fits RAM (`loading.moeNeedsMmap` false, the weights are bulk-read
    instead); RAM size unknown; less than `MIN_BYTES` (4 GiB) would be locked.
  - `profilePath` is `<overrides.moeProfileDir>/<model file name>.moe-profile`
    when the runtime has the tier flags, the offload runs with the GPU cache and a
    folder was given, else null; emitted as `--moe-profile`.
  - `registerMib` (luma-b6+, `flags.moeRamRegister`): the part of the tier each
    GPU registers for DMA uploads, the smaller of the tier and `REGISTER_SHARE`
    (0.2) of RAM divided by the local cards in `budget.perGpu`; emitted as
    `--moe-ram-register-mib`. Null (flag left out) on older builds.
- `RAM_SHARE`, `REGISTER_SHARE`, `MIN_BYTES`, `PROFILE_SUFFIX`.

## Why

A pool bigger than RAM loads memory-mapped and the OS page cache decides which
experts stay resident: a prompt scan reads every expert of every layer and
pushes out the ones generation keeps hitting, and Windows trims a big working
set so even resident experts soft-fault back in at 2 to 3 GB/s. The runtime
locks the budget in RAM at context creation (VirtualLock / mlock after a ranged
prefetch), the most used experts first once the profile has data and skipping
the ones its GPU cache already holds, so the tiers are: GPU cache, locked RAM,
page cache, SSD. The profile also seeds the GPU cache with the most used
experts before the first token of the next run.

The share is half of RAM: the rest stays for the OS, the page cache that streams
the unlocked experts, the lazily read tables (Engram) and everything else on the
box. DeepSeek-V4.1-Flash on a 190 GB box (2026-11-03) was the sizing case.

The register budget exists because the runtime's own default (40 percent of RAM,
76 GiB on this box) is more than the Windows display driver's pinned budget will
take on a bad day: on 2026-11-04 it died with CUDA out of memory in the first
decode, on the 5090 alone and as two 38 GiB halves on both cards, with 12 GB of
VRAM and 51 GB of RAM still free, while 40 GiB, 20 GiB and none loaded (the
sweep in `test-data/llm-launch-bench/dsv4-b6-regsweep`); the day before, the
same 76 GiB had loaded. The limit is on the total, and a registration is
portable (every local card maps it), so the plan registers a fifth of RAM in
total and divides it across the cards. The decode gain between 40 GiB, 20 GiB
and none was within noise on that sweep, so the cap costs little.

The plan is resolved after [LoadingPolicy](LoadingPolicy.md), since only an
mmap-served pool has a tier, and read by [PlanSummary](PlanSummary.md)
(`moeRamMib`, `moeRamOffReason`, `moeRamRegisterMib`, `moeProfilePath`) and
[ServingNotes](ServingNotes.md). [LaunchOverrides](../launcher/LaunchOverrides.md)
supplies `moeProfileDir` (the app's `moe-profiles` folder, created before the
spawn); the runtime writes the file itself.
