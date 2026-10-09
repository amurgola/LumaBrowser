# BridgeFramePayloads

`ide/vscode/src/BridgeFramePayloads.js`

Type-checked readers for the bridge's `ready` and `agents` payloads.

## Methods

- `BridgeFramePayloads.readyState(p, { root, approval })`: the session fields a `ready` sets.
- `BridgeFramePayloads.agentRows(p)`: `{ id, name, description, model, tools }` rows with an id and a name.
