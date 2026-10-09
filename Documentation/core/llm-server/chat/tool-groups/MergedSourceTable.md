# MergedSourceTable

`core/llm-server/chat/tool-groups/MergedSourceTable.js`

Data only: aggregator sources whose tools form one workflow and therefore one
lazy group instead of one group per tool.

## Members

- `MergedSourceTable.SOURCES` (frozen): `core.desktop` -> `desktop`
  ("Desktop control"), `core.games` -> `games` ("Game play"),
  `ext.tool-forge` -> `tool_forge` ("Tool forge"), each with its stub.
- `MergedSourceTable.forSource(source)`: the spec, or `null`. Own keys only, so
  a prototype name such as `constructor` is never a source.

## Why

As separate groups every step of one job cost an auto-activation bounce:
building one forge tool took three "auto-activated, re-issue your call" round
trips. Activating any tool of a merged group loads all of its manuals.
