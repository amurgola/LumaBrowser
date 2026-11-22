# FormatLabels

`core/llm-server/ui/js/setup-ui/frameworks/FormatLabels.js`

Readable names for the model formats the frameworks load: `gguf` is "GGUF models", `mlx` "MLX models", `basalt` "Basalt packs", `ninfer` "NInfer models"; any other id reads as is.

## Methods

- `FormatLabels.noun(formatId)`: the plural noun, used in the format default rows ("GGUF models run on").
- `FormatLabels.loadsText(formatIds)`: "Loads GGUF models", "Loads Basalt packs and NInfer models"; '' for none.

## Why

Format ids are storage keys; the card speaks of the files the user has.
