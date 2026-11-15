# ThinkPill

`core/llm-server/ui/js/chat/composer/ThinkPill.js`

The composer's thinking dial for THIS chat. It appears only when the selected
model's chat template reads the hint (asked of the host per model, else the live
server status; never guessed from the name). Untouched it follows the selected
model's (or profile's) Thinking setting from [ModelTunePanel](ModelTunePanel.md)
when one is set, else the Setup default (an install with "Disable thinking"
inherits Off), and stores nothing; the tooltip names which one it follows;
touching it writes to this conversation only, and clicking the chosen position
again returns to the default. Positions the host marks unavailable stay visible,
greyed, with the reason as tooltip.

## Methods

- `syncToModel()`: re-asks when the selection (model ref plus local path, a
  profile's base model included) moved.
- `load({ onlyIfUnknown }?)`: newer requests supersede older ones;
  `onlyIfUnknown` keeps a dial the host already answered definitively.
- `render()`.
- `ThinkPill.labelFor(dial, id)`.

Before the conversation row exists the position rides the next chat2 call;
afterwards `api.conv.setReasoningEffort(id, value)` persists it.

## Changes (2026-11-14, a paired host's model)

`_loadDefault` sets `state.thinkHostDecides` when the selected model (or a profile's base) is a paired host's row (`peer`), and does not read this side's Setup default for it: the pill then shows the Auto position as inherited and its tooltip says "Nothing is chosen here, so the setting of the host applies." A Tune setting on the model still counts as a choice and shows as before. This mirrors [ThinkingDial](../../../../chat/router/ThinkingDial.md), which sends nothing for such a model unless something was chosen.
