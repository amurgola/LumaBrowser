# VramCoordinator

`core/shared/runtime/VramCoordinator.js`

Decides where each managed model server (LLM, image generate, edit and video,
music, grounding) lands on a multi-GPU box, so they keep the chat fluid instead
of fighting over VRAM. Its claims live in a [VramLedger](vram/VramLedger.md).

## Policy

1. First come first serve: a loading or resident server reserves its cards at
   once, so a server starting moments later (while nvidia-smi still shows the
   first card free, because the weights are mid-load) does not pick the same card.
2. One card when the model fits it.
3. Else the fewest cards that fit together (splittable models only).
4. Else weights to RAM (`--offload-to-cpu`), resident compute pinned to the
   single emptiest card. Nothing is ever evicted.
5. Everything stays live until its own idle timeout; on unload the claim is released.

Tiers, in order: the unified v2 layout ([PlacementResolver](placement/PlacementResolver.md),
handed ledger-debited cards), then an explicit device setting
([VramOverride](vram/VramOverride.md)), then the automatic policy
([AutoVramPlacement](vram/AutoVramPlacement.md)). Singularity eviction happens
before, in [HotswapCoordinator](HotswapCoordinator.md)`.acquire`.

## Methods

- `VramCoordinator.shared` the process-wide instance; `new VramCoordinator()` an
  empty ledger (tests).
- `reserve({ serverId, role, requiredBytes, allowSplit = true, settingsDb, diagnostics })`
  returns `{ cudaDevice, offloadToCpu, devices, split }`. Throws
  `VramCoordinator.reserve: serverId is required`.
  - layout tier: the resolver's answer, recorded;
  - override tier: `''` records an empty claim and returns no pin; a device list
    pins it as given (`cudaDevice` is the trimmed string);
  - automatic, fewer than two cards: no pin, claim recorded on the card(s);
  - automatic, two or more: the policy above on debited cards. `cudaDevice` is
    null when every card is chosen without offload (the default spread).
  - `allowSplit: false` (image roles' first try) never spans cards; the
    auto-fit rescue retries with `true` so a newer sd-server can place modules
    per card.
  - An offloaded claim records `PlacementLayout.OFFLOAD_RESIDENT_BYTES` (8 GB),
    else `requiredBytes`.
- `hold(serverId, { devices, bytes, role = 'llm' })` an external claim (GPUs lent
  to a sharing peer); integer devices >= 0 only, non-positive bytes become 0.
  Throws `VramCoordinator.hold: serverId is required`.
- `release(serverId)` drops the claim.
- `setSplit(serverId, ratios)` records the real split (normalised weights); false
  when the claim is missing or the ratio count differs or no ratio is positive.
- `debitedDevices(diagnostics, { excludeServerId })` the probed cards
  ([CudaDeviceProbe](CudaDeviceProbe.md)`.readDevices`) minus every other live claim.
- `markResidentOnReady(emitter, serverId)` `ready` flags the claim resident
  (no longer debited); `starting` or `loading` clears it. Returns an unsubscribe.
- `releaseOnIdle(emitter, serverId)` `idle` or `error` releases. Returns an unsubscribe.
- `snapshot()` a copy of every claim `{ devices, bytes, offloadToCpu, role, ts, weights?, resident? }`.

## Why

The layout path used to read raw nvidia-smi numbers, which never show an
in-flight load, so two servers started back to back (PlacementService.startAll)
could both be handed one card (bug H11); the layout now gets debited cards.
A split claim is weighted by its real tensor split because an even spread of a
47:18 fill once pinned an image model onto a 5090 at 31.8/32.6 GB while the 3090
had 12 GB free. A resident claim stops debiting because nvidia-smi already shows
it; counting it twice made both cards look full. A missed release is silent and
debits a card for the rest of the session, so ending a claim on `idle` and
`error` is the coordinator's job, not each caller's.
