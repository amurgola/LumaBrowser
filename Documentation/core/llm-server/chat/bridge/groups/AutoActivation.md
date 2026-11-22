# AutoActivation

`core/llm-server/chat/bridge/groups/AutoActivation.js`

The auto-activate guard for a lazy tool called before its group is loaded: the group
loads and the call runs, with the group's manual riding back on its result. Only a render
is sent back with the manual first.

## Methods (all static)

- `check(name, params, groups)`: null when the tool owns no group (browser
  tools) or ANY owning group is active. Otherwise activates the primary
  (first) owning group and returns `{ group, docs }` (run it, then append the
  manual), unless the group is one whose rules come first
  ([ToolGroupState](ToolGroupState.md)`.rulesFirst`: images, video, music) and
  the call carries no generated payload
  (`ToolGroups.carriesGeneratedPayload`). Then it returns `{ bounce }`:
  `{ success: true, activated, autoActivated: true, message }`, `message` from
  `sentBack`.
- `sentBack(name, group, docs)`: `<name> was NOT run: nothing has happened yet.
  Its tools ("<group>") were not loaded; they are loaded now. Read the
  instructions below, then call <name> again, following them.` and the manual.
- `appendManual(result, activation)`: appends `manualNote(activation)` to
  `result.message` (or sets it). No-op without docs or an object result.
- `manualNote(activation)`: `The "<group>" tools are now active (auto-loaded by
  this call). Your call ran; these are the rules for using them from here:` and
  the manual, led by a blank line; `''` for a call that loaded no group. Also
  what a background start hands on
  ([ToolCallPipeline](../tools/ToolCallPipeline.md)`.admitDetached`).

## Why the call runs

| | sent back (old wording) | sent back (says NOT run first) | runs |
|---|---|---|---|
| Gemma 4 E4B: command really ran | 3 of 9 | 9 of 9 | 9 of 9 |
| Gemma 4 E4B: asked-for facts right | 9 of 15 | 15 of 15 | 15 of 15 |
| Gemma 4 E4B: results made up | 1 | 0 | 0 |
| Gemma 4 E4B: seconds until the command started | 12.3 | 11.2 | 5.5 |
| Gemma 4 E4B: seconds until everything was answered | 37.7 (of those that ran) | 36.7 | 30.3 |
| Qwen3.8-27B: seconds until the command started | 10.6 | 10.4 | 8.6 |
| Qwen3.8-27B: seconds until everything was answered | 34.8 | 34.8 | 33.0 |

With the old wording Gemma reported the command as executed, or stated a number
it never saw, in six of nine trials. Saying first that nothing ran fixed the
misreading; running the call fixed it too and saved the step.

A render keeps the send-back, in the clear wording: its manual decides what the
call should say (prompt style, sizes, `edit_image` strength), and a wrong first
call costs a render of seconds to minutes. A call that carries a generated
document is never sent back: bouncing throws it away, which once cost an
artifacts task its entire budget. A tool in two groups (`edit_artifact`) passes
when either is active.
