# ChatTurnInputs

`core/network-sharing/host/llm/ChatTurnInputs.js`

Derives a shared chat turn's inputs from the request and the optional host
agent driving it.

## Methods

- `ChatTurnInputs.images(attachments)`: `{ name, mime (default image/png),
  base64 }` for each `kind: 'image'` attachment with base64; `[]` for a non-array.
- `ChatTurnInputs.wantsAgent(body, agentTurn)`: the agent's `agent` flag when
  an agent drives the turn, else `body.agent === true || body.tools === true`.
- `ChatTurnInputs.allowedTools(agentTurn, hostAllowList)`: without an agent
  grant, the host list (null = unrestricted); with one, the grant filtered by
  the host list when that is set.
- `ChatTurnInputs.streamMessages(agentTurn, wantAgent, messages)`: prepends
  `{ role: 'system', content: systemPrompt }` for a tool-less persona agent on
  the plain path; otherwise the messages unchanged.

## Why

A paired client is fully trusted (pairing is the boundary), so its flag runs
the host's agent toolset; when an agent drives the turn, its own grant decides
instead, narrowed by the host's web allow-list.
