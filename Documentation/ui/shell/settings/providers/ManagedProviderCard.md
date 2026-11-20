# ManagedProviderCard

`ui/shell/settings/providers/ManagedProviderCard.js`

Card of the auto-managed local LLM server. Endpoint and runtime are shown with Copy buttons; the model is a picker over every installed chat model (the entry's `models`, labelled by `luma_label`), and a pick becomes the server's default model. Folded, it is one row naming the model in use.

## Methods

- `ManagedProviderCard.build(config, ctx = null)`, `html(config)`, `parts(config)` (for [ProviderCardShell](ProviderCardShell.md)). `ctx` is the [ProviderList](ProviderList.md) context (`list`, `log`, `pingChat`); without it the picker is disabled.
- A model pick sets `config.selectedModel`, saves through `ctx.list.save()` (main's `saveEditedConfigs` makes it the local default), logs the result, pings the chat and redraws the list, since the card name and the Default LLM choice carry the model's name.

## Globals

None.
