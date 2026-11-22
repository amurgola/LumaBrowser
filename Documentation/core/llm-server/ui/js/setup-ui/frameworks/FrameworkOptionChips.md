# FrameworkOptionChips

`core/llm-server/ui/js/setup-ui/frameworks/FrameworkOptionChips.js`

What a framework's collapsed Options fold says: the drawn options whose value differs from a fresh install ("KV q8_0", "4 parallel", "Tensor split", "Context retention", "MoE GPU cache off", "Peer GPUs", "RAM pin", "OpenVINO NPU"; a custom switch by its label or "<label> off", a custom choice as "<label> <choice>").

## Methods

- `FrameworkOptionChips.labels(options)`: `options` is `FrameworkOptionRows.shown(...)`, so a row that is not drawn has no chip. Drawn as plain text by [MoreSettingsChips](../defaults/MoreSettingsChips.md)`.chipsHtml`.

## Why

These chips used to sit on the Chat defaults "More settings" handle; they moved with the options.
