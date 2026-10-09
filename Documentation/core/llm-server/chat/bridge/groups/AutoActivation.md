# AutoActivation

`core/llm-server/chat/bridge/groups/AutoActivation.js`

The auto-activate guard for a lazy tool called before its group is loaded.

## Methods (all static)

- `check(name, params, groups)`: null when the tool owns no group (browser
  tools) or ANY owning group is active. Otherwise activates the primary
  (first) owning group and returns `{ group, docs }` when
  `ToolGroups.carriesGeneratedPayload(name, params)` (run it), else
  `{ bounce }`: `{ success: true, activated, autoActivated: true, message }`
  asking the model to RE-ISSUE with the manual.
- `appendManual(result, activation)`: appends `The "<group>" tools are now
  active (auto-loaded by this call). Your call ran; ...` plus the manual to
  `result.message` (or sets it). No-op without docs or an object result.

## Why

The bounce makes the model read the usage rules before its first real call,
but bouncing a call that carries a generated document throws it away; that
cost an artifacts task its entire budget. A tool in two groups
(`edit_artifact`) passes when either is active.
