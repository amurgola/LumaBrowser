# PlacementNotes

`core/llm-server/server/launch/PlacementNotes.js`

The plan notes that explain where a launch runs.

## Methods

- `PlacementNotes.build(state)` returns, in order: `Runtime: <name> (<binary dir or id>).`;
  `Model: <name>, <size>[ + <mmproj> mmproj[ (not loaded this launch, text-only)]].`;
  the header facts (or `GGUF header: unreadable (<error>); ...`); `VRAM usable`
  (or no GPU); `Estimated VRAM need` with its composition (weights, loaded
  projector, KV label with the hybrid layer count, GPU scratch, MTP branch), or
  the 20% fallback; the decision (fill-order split, default split with the
  single-card hint, plain default split, partial offload with its per-layer
  figures, or one of the CPU-only reasons); on a full offload with `softHeadroom`,
  `GPU headroom: reduced to <soft reserve> on <card> for this load (setting: <headroom>) ...`;
  `Context: <n> tokens[ (model native max)]`. A fill-order split that names a device
  order adds a sentence giving the `--device` list (slowest first) and that the fastest
  card holds the output layer and the draft model.

## Why

The notes are the user's only view of why a model landed where it did, so they
show the numbers behind the decision. Sizes use [ByteLadder](../ByteLadder.md).
The KV label reads `q8 KV` when either side is q8_0 and `f16 KV` otherwise
(including a q4_0 V cache), as legacy did.
