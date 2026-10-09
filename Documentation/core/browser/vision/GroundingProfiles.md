# GroundingProfiles

`core/browser/vision/GroundingProfiles.js`

How to ask each grounding model family for a click point, and which family a model name belongs to.

## Methods

- `GroundingProfiles.getProfile(idOrModel)` returns the profile with that id, else the
  `profileForModel` match; falsy input returns the `pixels` profile.
- `GroundingProfiles.profileForModel(name)` matches a model id or GGUF file name. Order:
  `holo`, `mai-ui`, `ui-venus`, `qwen25`, `qwen3`, then `pixels` as the fallback.
- `GroundingProfiles.PROFILES` is the table, keyed by id.
- `GroundingProfiles.QWEN3_MIN_PIXELS` (1024 * 32 * 32) and `DEFAULT_MAX_PIXELS` (2,100,000).

## Profile fields

- `id`, `label`, `match` (regex against the model name; `null` for `pixels`).
- `coordFormat`: the CoordinateSpace format key the model answers in.
- `factor`: patch multiple the encoder needs (28 Qwen2.5-VL, 32 Qwen3-VL / Qwen3.5+); `null` for
  APIs that take any size.
- `minPixels` / `maxPixels`: budget for the image actually sent. llama.cpp warns Qwen-VL grounding
  needs at least 1024 image tokens, i.e. 1024 * 32 * 32 px for the 32-factor families.
- `maxLongEdge`: cap for factor-less (API) profiles.
- `request`: extra OpenAI-compatible body fields.
- `buildMessages({ instruction, dataUrl, sent })`: the chat messages to send.

## Why profiles

A grounding model is only as accurate as the harness around it: the prompt it was trained on, the
coordinate convention it answers in, and the image geometry its encoder expects. Get one wrong and a
70%-on-ScreenSpot model scores like a 30% one. Each profile pins all three from the vendor's own
reference code (URLs in the source).

Grounding is a lookup, not a deliberation, so the vendor profiles send `temperature: 0` and
`chat_template_kwargs.enable_thinking: false` (honoured by llama-server and vLLM; hosted APIs ignore
it). MAI-UI is the exception: it reasons in `<grounding_think>` first, so it gets 768 tokens.

Fine-tunes are matched before their base family: a Holo3.1 GGUF also says "qwen3", but it answers in
Holo's JSON. Frontier APIs (`pixels`) answer in pixels of what they saw, so the image is kept under
their 1568 px downscale threshold and its size is stated in the prompt.
