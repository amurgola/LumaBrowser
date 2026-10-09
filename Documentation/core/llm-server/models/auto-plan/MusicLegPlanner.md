# MusicLegPlanner

`core/llm-server/models/auto-plan/MusicLegPlanner.js`

The music leg of [AutoPlanner](../AutoPlanner.md) (MiniMax-Music3 via SGLang-Omni).

## Methods

- `plan({ wantMusic, musicModels, musicEligibility, machine })` returns
  `{ music, skippedReason }` (both null when music was not asked for). It uses the
  first catalog row; needs fall back to 34 / 20 / 13 GB for solo, AR and DiT.
  Skip reasons, in order: no row; neither the biggest card holds the solo need nor
  the two biggest hold AR and DiT; `musicEligibility.wslReady === false`.
  `music` is `{ modelId, label, runtimeId: 'sglang-omni', approxTotalBytes, minVramBytes, solo }`
  where `solo` means the biggest card holds both stages.
- `pool({ music, hasImage, machine, placement })` returns `{ placement, pooled }`:
  a solo leg on a GPU box with a CUDA card joins a singularity on the biggest card
  (`['llm', 'imageGenerate'?, 'music']`) when that card already hosts the pool or
  the box has at most one CUDA card; otherwise the placement is unchanged.
- Constants `SOLO_NEED_BYTES`, `AR_STAGE_BYTES`, `DIT_STAGE_BYTES`.

## Why

Music stays out of the coexist and swap math: it loads on demand and places
first-come. With one GPU both stage processes colocate; with two the AR backbone
takes the biggest card and the fp32 DiT/DAV stage the second, so the gate is per
stage. Music has no degraded tier (sgl-omni cannot stream from RAM), so with
nowhere else to go it takes turns in a pool; on a multi-GPU box no pool is
created for it, because pinning chat and images to one card would cost every
session that never asks for a song. Only the solo shape can join a pool, which
pins members to one card.
