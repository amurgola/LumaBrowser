# CharArtField

`core/llm-server/ui/js/chat-ext/fields/CharArtField.js`

`type: 'charart'`: multi-shot subject art in `model[key]`
(`{ base, <derivativeKey>, extraEmotions }`), rendered by
[CharArtStudio](CharArtStudio.md). Config: `genFromKey`, `styleFromKey`,
`contextFromKey`, `modelFromKey`, `refModelFromKey`, `basePrefix`,
`baseSuffix`, `baseWidth`/`baseHeight`, `derivatives: [{ key, label, prompt,
width, height, context?, subject?, steps?, sampler?, scheduler?, cfgScale?,
strength?, snapNative? }]`.

## Methods

- `render(wrap, spec)`.
