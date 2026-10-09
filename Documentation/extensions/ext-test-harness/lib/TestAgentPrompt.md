# TestAgentPrompt

`extensions/ext-test-harness/lib/TestAgentPrompt.js`

The harness agent's system prompt.

## Methods (static)

- `build(tabInfo)`: active tab, the fenced ```` ```tool ```` call format,
  the browser tool list and the additional rules.
- `defaultTabId(tabInfo)`: the id in `Tab N: ...`, else `'0'`; used in every
  example's `"tabId"`.

## Why

The text mirrors the in-app agent prompt of the time the harness was written,
so harness runs stay comparable with older recorded runs.
