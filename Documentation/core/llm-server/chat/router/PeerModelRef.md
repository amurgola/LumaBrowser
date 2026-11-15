# PeerModelRef

`core/llm-server/chat/router/PeerModelRef.js`

Says whether a chat model ref is a paired LumaBrowser host's model.

## Methods

- `new PeerModelRef({ db })`: `db` the settings database (`llm.providerConfigs`).
- `is(modelRef)`: true when the ref's provider config exists and is `peerManaged`. False for local, helper and
  profile refs, other remote providers, a malformed ref, and when the settings cannot be read.

## Why

A paired host's model runs under the host's own settings, so this side's defaults for its local server do not apply
to it. [ThinkingDial](ThinkingDial.md) asks this before it falls back to the Setup default.
