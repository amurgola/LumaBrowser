# ThinkPill

`core/llm-server/ui/js/chat/composer/ThinkPill.js`

The composer's thinking dial for THIS chat. It appears only when the selected
model's chat template reads the hint (asked of the host per model, else the live
server status; never guessed from the name). Untouched it follows the Setup
default (an install with "Disable thinking" inherits Off) and stores nothing;
touching it writes to this conversation only, and clicking the chosen position
again returns to the default. Positions the host marks unavailable stay visible,
greyed, with the reason as tooltip.

## Methods

- `syncToModel()`: re-asks when the selection (model ref plus local path) moved.
- `load({ onlyIfUnknown }?)`: newer requests supersede older ones;
  `onlyIfUnknown` keeps a dial the host already answered definitively.
- `render()`.
- `ThinkPill.labelFor(dial, id)`.

Before the conversation row exists the position rides the next chat2 call;
afterwards `api.conv.setReasoningEffort(id, value)` persists it.
