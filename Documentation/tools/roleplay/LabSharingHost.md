# LabSharingHost

`tools/roleplay/LabSharingHost.js`

The host half of Network Sharing for the Roleplay Lab: the app's own
chat-completions handler (`ChatCompletionTurn`) over a second chat router, on a
loopback port. A Lab run pointed at it plays a story the way a paired client
does, without pairing two apps.

## Methods

- `new LabSharingHost({ router, modelRef, effort })`: `router` the host's chat
  router (`proxyStream`), `modelRef` the `local::` ref it shares, `effort` the
  host's thinking dial position (what fills in when a client says nothing).
- `start()` listens on `127.0.0.1` (a free port) and resolves `endpoint()`
  (`http://127.0.0.1:<port>/sharing/llm`). Routes: `POST /sharing/llm/v1/chat/completions`
  (the real handler, with a stand-in `sharingToken`) and `POST /sharing/llm/v1/chat/abort`.
- `providerConfig(contextWindow)`: the provider config a paired client holds for
  this host (`PeerProviderConfigs`' shape: `peerManaged`, the model with its
  `luma_context`); `clientRef()`: the ref a client routes on
  (`peer:lab:llm::<modelRef>`).
- `requests`: one `wireSummary(body)` per request that arrived: every body field
  but the messages, plus their count and total size.
- `stop()`.

## Why

Every Lab and e2e run drove a local model, so the sharing path (the client's
`RemoteStream`, the provider's request body, the host's handler and its local
request) had never carried a roleplay turn under test. The first run through it
showed what crosses and what does not ([RemoteStream](../../core/llm-server/chat/router/RemoteStream.md),
2026-11-14). Used by [TextRunCli](TextRunCli.md) `--via-host`.
