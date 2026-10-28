# ModelTunePanel

`core/llm-server/ui/js/chat/composer/ModelTunePanel.js`

The Tune dialog for one model or model profile, opened from the sliders button
on a [ModelPicker](ModelPicker.md) row and from Setup's "Tune this model…"
button ([SetupClickRouter](../../setup-ui/SetupClickRouter.md)). Each setting
either inherits or is overridden: a select's first choice and a number field's
placeholder read "Inherit (<value>)", naming what a blank field resolves to
(for a profile, "model: <value>" when its base model sets one), and an overridden
row carries an accent dot. Settings layer Defaults, then model, then profile;
see [ModelSettings](../../../../service/ModelSettings.md).

- Every model and profile: Thinking, Temperature, Reply limit (tokens),
  Parallel tools (1 to 8 calls at once in Tools-on turns; "Inherit (one at a
  time)" is the measured default, see
  [ToolConcurrency](../../../../../llm-service/ToolConcurrency.md); its row's
  tooltip says what it does and why one is the default), Run timeout (minutes
  one Tools-on turn may run before it stops with the "send continue" error;
  0 is no limit, shown as "Inherit (no limit)" when that is the inherited
  value) and Run steps (replies one turn may take). The last two inherit
  [AgentBudget](../../../../chat/bridge/AgentBudget.md)'s chat defaults (8 and
  24) and are the user's floor: a mode that asks for more keeps it.
- A local model itself (never a profile): KV cache and Extra flags, under
  "When this model loads" since they apply on the model's next load.
- A model offers "Save as profile…" (the form's request fields become a new
  named profile, which is then selected; the model itself is unchanged). A
  profile shows an editable name and "Delete profile".

Blank fields are left out of the save, which is what "inherit" means to the
store. A refused save (a duplicate profile name, say) keeps the dialog open
with the host's reason. Escape and the backdrop cancel; Enter saves, except
while the nested name prompt or delete confirm is open.

## Methods

- `static available(api)`: whether the host exposes `api.modelSettings` (the
  web client does not, so no Tune button is drawn there).
- `open(ref, label, { highlight? })`: fetches `modelSettings.get(ref)` and
  shows the dialog. `highlight` names a field whose row opens outlined
  (`cm-setting-hl`, `OUTLINE_CLASS`), scrolled to and focused, until it is
  edited: an [ErrorCard](../turns/ErrorCard.md)'s "Edit setting" lands here
  through [SettingLink](../turns/SettingLink.md).
  `ctx` needs `api`, `root`, `state.models` (for the base model's label),
  `models.refresh()` and `models.selectRef(ref)`; `thinkPill.load()` is called
  after a save when present.
