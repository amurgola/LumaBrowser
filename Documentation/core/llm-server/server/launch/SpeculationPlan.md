# SpeculationPlan

`core/llm-server/server/launch/SpeculationPlan.js`

Decides which speculative-decoding branch a launch runs and what it adds to the
VRAM budget.

## Methods

- `SpeculationPlan.resolve({ files, flags, overrides })` returns
  `{ mtpDetached, specDrafterOff, dflashEnabled, mtpDetachedUnsupportedByDialect, mtpEnabled, mtpDraftNMax, ngramSpecOff, ngramSpecEnabled, specDrafterBytes, mtpBranchHeadBytes, mtpBranchBytes, draftCacheType }`.
  - family drafter (DFlash): a paired drafter file, `-md` support, the family
    publishes one, and no `noSpecDrafter` kill switch;
  - MTP: `mtpCapable`, the right flags (a detached head also needs `-md`), no
    family drafter, and not a detached head on the ik dialect;
  - n-gram: an opted-in family, no other drafter, mainline dialect, `--spec-type`
    accepted, no `noNgramSpec`;
  - draft cache: `DRAFT_CACHE_TYPE` only on `quantizeDraftCache`, a drafter
    running, both draft flags and flash attention.
- `MTP_DRAFT_N_MAX` (3), `IK_MTP_DRAFT_N_MAX` (3), `NGRAM_MOD_N_MATCH` (40),
  `NGRAM_MOD_N_MIN` (0), `NGRAM_MOD_N_MAX` (16), `NGRAM_SOLO_N_MAX` (4),
  `DRAFT_CACHE_TYPE` (`q4_0`).

## Why

- MTP n_max 3: on Qwen3.8-27B-MTP N=3 gave 77.2 tok/s at 0.853 acceptance, N=2
  71.0 at 0.869; each step pays a full verify either way. A family can override it.
- ik n_max 3: on one 5090, n_max 1/2/3/4 gave 68/84/93/94-97 tok/s; 3 is the
  consistent 1.75x. The ik ngram-mod chain measured erratic and was dropped.
- Standalone n-gram cap 4 on Qwen3.8-Flash-Next with experts in RAM: +26% code
  edits, +10% prose, -6% worst case, where the default draft length lost 30%.
- The draft cache stays off by default: it saved 21 MiB and cost 20-30%
  generation on Qwen3.8-27B-MTP.
- The family drafter wins over MTP because its authors published and measured
  it; the kill switch exists because a day-0 drafter that mis-verifies changes
  output and loads before the main model.
