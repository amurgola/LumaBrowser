# ImagePromptProfiles

`core/image-server/prompt/ImagePromptProfiles.js`

Per-model-type prompting profiles: how an image model wants its prompt written
(booru tags or natural language), plus its quality prefix, default negative
prompt and sampling tweaks.

## Methods

- `ImagePromptProfiles.getProfile(id)` returns a profile or `null`.
- `ImagePromptProfiles.profilesForBase(baseType)` returns
  `[{ id, label }]` for the profiles that apply to an import base (`'sdxl'`,
  `'sd-1-5'`), in display order.
- `ImagePromptProfiles.profileDefaultsPatch(id)` returns the `defaults` patch a
  profile contributes: its sampling `defaults` plus `promptPrefix`,
  `negativePrompt`, `promptGuide` (empty values omitted). Unknown ids give `{}`.
- `ImagePromptProfiles.PROFILES` (`sdxl-illustrious`, `sdxl-pony`, `sdxl-photo`,
  `sdxl-generic`, `sd-1-5-generic`), each `{ label, appliesTo, prefix, negative,
  defaults?, guide }`.
- `ImagePromptProfiles.DEFAULT_PROFILE_BY_BASE` is the import-time default per
  base; `ImagePromptProfiles.FAMILY_FALLBACK_PROFILE` is the runtime fallback per
  family for models that never stored a guide or negative.

## Why

Image families want very different prompts: Illustrious/NoobAI want Danbooru
tags plus their own quality tags, Pony wants `score_9, score_8_up, ...` plus
booru tags, photoreal SDXL wants a natural-language description. A paragraph for
a booru model (or tags for a photo model) gives flat, off-style results.

Profiles are baked into a model's stored `defaults` at import time so each
installed model carries its own hint; the family fallback covers models that
never declared one. The `guide` is what the chat agent reads; the `prefix` is
auto-prepended by the router, so the guide tells the agent not to repeat it.

Guide and label text had its em-dashes replaced with ASCII punctuation during
the port (user-facing text rule).
