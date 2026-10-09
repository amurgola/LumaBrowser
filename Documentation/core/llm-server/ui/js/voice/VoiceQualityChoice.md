# VoiceQualityChoice

`core/llm-server/ui/js/voice/VoiceQualityChoice.js`

The voice choice: catalog tiers in Low, Fast, Medium, High order, then
extension engines' voices grouped under the engine name (no download here; the
add-on's Setup tab owns them). Picking an uninstalled tier downloads it, sets
it as default and pre-warms. Hidden on a remote client.

## Methods

- `new VoiceQualityChoice(api)`; `render(pop, note)`; `VoiceQualityChoice.tiers(catalog)`.
