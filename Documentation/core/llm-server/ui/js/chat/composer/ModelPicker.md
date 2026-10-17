# ModelPicker

`core/llm-server/ui/js/chat/composer/ModelPicker.js`

The model selection: the listed models, local models with per-context options
(fit-measured or estimated), each model followed by its model profiles (rows
from `listModels` with `isProfile`, `baseRef`, `profileName`), the pill label
("Local · Qwen3-8B · Precise · 16k"), the picker popover with a sliders "Tune"
button on every model and profile row (opens [ModelTunePanel](ModelTunePanel.md);
hidden when the host has no `api.modelSettings`), and the context window the
usage meter divides by.

## Methods

- `refresh()`: `api.listModels`; keeps a still-listed selection, else the
  default, else the first; feeds [Availability](Availability.md).
- `loadLocal()`: `api.getLocalModelOptions` (fire and forget), seeding the pinned
  model's context from the live default.
- `renderPill()` (every selection change ends here, so the thinking dial and
  the landing's status line follow: "<name> runs on this machine. Nothing
  you type leaves it." for a local model, "Chatting with <label>." otherwise; empty
  until a model is known).
- `currentLabel()`, `chosenCtx(model)`, `activeCtxWindow()`.
- `selectLocal(model, tokens)`: persists `setDefaults({ modelPath, contextSize })`
  and `setLastModelRef`. `selectRemote(model)`.
- `selectProfile(row)`: selects the `profile::` ref; a local profile also loads
  its base model at that model's chosen context, like picking the model would.
  A context chip under the base model of a selected profile keeps the profile.
- `selectRef(ref)`: selects any listed model, local model or profile.
- `selectedLocal()`: the local model behind the selection, a profile's base
  included (the thinking dial asks about this model).
- `openPicker(anchor, refresh)`: local models with context chips and their
  profiles, then Anthropic and Providers groups (each model followed by its
  profiles) (and the plain local entry while the rich list has not
  landed); clamped with [PopoverFit](../common/PopoverFit.md); `refresh`
  re-fetches local options for the NEXT open only. Clicks inside the popover
  stop there, so a pick closes it instead of bubbling to the anchor pill and
  reopening it.
