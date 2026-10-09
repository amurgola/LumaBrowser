# ReasoningEffort

`core/shared/llm/ReasoningEffort.js`

The thinking dial: how hard a reasoning model should think, from Off through
the effort levels.

## Methods

- `ReasoningEffort.LEVELS` is `['default', 'low', 'medium', 'high', 'xhigh']`,
  cheapest first. `'default'` means send nothing.
- `ReasoningEffort.LADDER` is `['minimal', 'low', 'medium', 'high', 'xhigh', 'max']`,
  the rung order `nearestEffort` walks.
- `ReasoningEffort.COMMON_LEVELS` is the domain assumed for an unprobed model.
- `ReasoningEffort.AGENT_DEFAULT` is `'low'`, the level for a tool loop nobody
  set a level for.
- `ReasoningEffort.DIAL_POSITIONS` is the dial as a person sees it:
  `{ id, short, label }` for `off`, `default`, `low`, `medium`, `high`, `xhigh`.
- `ReasoningEffort.DIAL_IDS` is the ids of those positions.
- `ReasoningEffort.normalizeDial(position)` returns a dial id; anything
  unrecognised becomes `'default'`.
- `ReasoningEffort.normalizeEffort(level)` returns one of `LEVELS`; anything
  unrecognised (including `'off'`) becomes `'default'`.
- `ReasoningEffort.extraFor(level)` returns
  `{ chatTemplateKwargs: { reasoning_effort } }` for a real level, or `null`.
- `ReasoningEffort.resolveDial({ turn, conversation, fallback })` returns the
  dial id that applies: the first layer that is not `null`, `undefined` or
  `''`, normalised; `'default'` if none is set.
- `ReasoningEffort.nearestEffort(level, levels)` maps a level onto a model's
  levels: exact, else the nearest rung up, else down. `levels` null means the
  common four; an empty array means the model has none, so everything is `null`.
- `ReasoningEffort.dialPositionsFor(thinking)` returns copies of the dial
  positions, each with `enabled` and, when disabled, a `reason` the UI shows.
  Only facts with `source: 'probe'` disable anything.

## Why it rides on the request, not a launch flag

llama-server has `--reasoning-effort`, but one server serves chat turns, agent
runs, roleplay and scheduled tasks at once, and they do not want the same
budget. Effort is a property of the task.

## Transport

The level goes out as a chat-template kwarg, the way llama.cpp describes the
knob. Templates that do not read it ignore it, and servers without
`chat_template_kwargs` drop it, so sending it is safe anywhere. Verified on
llama.cpp CUDA 13 serving Qwen3.8-27B, one puzzle at greedy decoding:

| Sent | Reasoning characters |
|---|---|
| nothing | 38260, answer never reached |
| `chat_template_kwargs` | low 25709 / xhigh 38175 |
| top-level field | low 25731 / xhigh 38260 |

The kwarg is read; the top-level spelling behaves the same, so we send the one
llama.cpp documents. Sending nothing equals `xhigh`: that template starts at
its most expensive setting. Only `low` finished reasoning inside the budget.

`'default'` sends nothing, and it is the shipped default, so this setting never
changes a model's behaviour until someone chooses a level.

## One dial, two mechanisms

"Should it think" and "how long for" are separate mechanisms internally (the
thinking-off body knobs, and this template hint), but people see one control
with Off as its cheapest position. So `'off'` is a dial position and never an
effort level: the router routes it to the thinking-off path. Keeping that split
here means the UI, settings and router agree on the positions.

## Why an absent layer defers

If an unset conversation meant `'default'`, a chat nobody touched would
override the user's global setting with Auto. An explicit `'default'` is a
choice and does win.

## Why the agent default is low

With no preference, `'default'` lets the template decide, and Qwen3.8's decides
xhigh on every step of an agent loop, where a step picks the next call from a
short menu. Raise it per turn or conversation when a task needs deliberation.

## Why rounding goes up first

Asking for more thinking should never silently get less.
