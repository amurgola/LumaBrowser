# BasaltModelEntries

`extensions/basalt-runtime/BasaltModelEntries.js`

The five upstream Basalt packs offered as one-click add-on models, with the
per-pack facts the launch planner needs. Either Basalt build runs them.

## Statics

- `ENTRIES`: `qwen3.8-27b-basalt` (`Qwen3.8-27B-QUASAR-NVFP4.basalt`, 21.1 GB),
  `qwen3.8-flash-next-basalt` (`Qwen3.8-FN-NVFP4-DQ6_K.basalt`, 131.7 GB),
  `deepseek-v4.1-flash-basalt` (`DeepSeek-V4.1-Flash-1017-UD-IQ1_M.basalt`,
  260.0 GB), `hy4-flash-basalt` (`Hy4-flash-NVFP4.basalt`, 158.7 GB),
  `inkling-2-mini-basalt` (`Inkling-2-Mini-NVFP4-DQ8.basalt`, 19.7 GB). Sizes and
  sha256 are the Hugging Face API's (`/api/models/<repo>/tree/main`, read
  2026-11-22); the packs are upstream's defaults. Each has `kind: 'basalt'`,
  `requiresRuntime` = [BasaltCatalog](BasaltCatalog.md)`.RUNTIME_IDS` (both
  builds, the LumaByte one first), `dir: 'basalt'`, `file`, `hfRepo`,
  `contextLength` (262,144 for the Qwen packs, 1,048,576 for the others),
  `defaultContextSize` 131,072, a `sidecar` (`quant`, `modelId`, which becomes
  `--alias`) and a `basalt` block:
  - `packPattern`: the upstream file-name prefix, for other quants copied in by hand;
  - `family`: the core chat family (`qwen38`, `qwen38-flash-next`,
    `deepseek4`, `inkling2`; null for Hy4-flash, which core has no family for);
  - `vision`: the pack carries a projector;
  - `sizing`: `card` for the dense 27B (priced against the card), `engine` for
    the mixture-of-experts packs;
  - 27B only: `cardFixedBytes` (18 GiB) and `slotStateBytes` (157 MiB);
  - `kv`: `default`, `formats` (format to bytes per position where the docs
    give it) and, for Flash-Next, `parallel: 'int8'`.
- `hfUrl(repo, file)`: the `resolve/main` URL.
- `forModel(model)`: the entry for a scanned model: by `addon.id`, else the
  weight file name, else `packPattern`; null for a pack of an unknown model.

## Why

`requiresRuntime` names both builds so a pack set up through one keeps running
when the user switches to the other, and "Download & set up" installs a build
only when neither is installed (core `AddonModelSetup`).

Upstream renamed the Inkling 2 Mini pack from `...-NVFP4-q8.basalt` to
`...-NVFP4-DQ8.basalt` (same bytes and digest) between 2026-11-21 and
2026-11-22, which turned the old URL into a 404; a copy under the old name
still matches through `packPattern`.

The `basalt` block lives on the entry rather than the sidecar because core's
`AddonModelBuilder` copies only a fixed set of sidecar fields onto
`model.addon`; the planner looks the entry up by the add-on id instead.

The 27B figures fit the limits measured on a 5090 with 2.4 GiB of desktop
(2026-11-21): `--kv int8` holds 262,144 positions (33 KiB each), `--kv fp16`
holds 184,000 and refuses 190,000 (64 KiB each). Weights with the drafter are
16.0 GiB on the card; the rest of the fixed 18 GiB is workspace and Basalt's
700 MiB VRAM reserve. Flash-Next serves more than one slot only with int8 KV
(upstream configuration docs).
