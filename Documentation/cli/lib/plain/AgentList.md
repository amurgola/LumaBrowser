# AgentList

`cli/lib/plain/AgentList.js`

Prints the bridge's `agents` frame for `luma --agents` and `/agents` in a plain session.

## Methods (static)

- `AgentList.print(payload, renderer, out = process.stdout)`: one row per agent, the name padded to
  the longest (at least 5), then `model (or "(default model)") · N tool(s)[ · N KB doc(s)]`, the
  description on the next line. No agents prints
  `No agents yet. Create one in LumaBrowser → Setup → Agents.`
