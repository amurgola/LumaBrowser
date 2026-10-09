# ToolAdmission

`core/llm-server/chat/ToolAdmission.js`

Admits tools that appeared, or became allowed, during an agent run into that
run's live tool set.

## Methods

- `ToolAdmission.admitNewTools({ dynamicTools, known, policy })` returns
  `{ admitted }`: the entries of `dynamicTools` (in order) with a name not in the
  `known` Set and allowed by `policy`. `policy` is a fresh allow-list array,
  `null` for unrestricted, or `undefined` for "no policy source", which admits
  nothing. Junk entries and a non-array tool list are ignored.

## Why

A run snapshots the aggregator and the user's allow-list once, at start. That was
fine until a tool could create tools: the Tool Forge's `publish_tool` registers a
new tool mid-run, and the model's very next call to it was refused as "not
allowed for this run" although it existed and was enabled. A tool result that
carries `toolCatalogChanged: true` now triggers this admission pass.

The pass is pure: the caller (AgentChatBridge) supplies the current aggregator
view, the run's known names and a fresh allow-list from the router's policy, and
mutates its own run state. A run whose allow-list was pinned by a chat mode (Code
mode) passes no policy and keeps its pin.
