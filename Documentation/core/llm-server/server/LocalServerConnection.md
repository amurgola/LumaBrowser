# LocalServerConnection

`core/llm-server/server/LocalServerConnection.js`

What a request to the running local server must carry, read from its
supervisor ([LlmRuntimeServer](LlmRuntimeServer.md)): where it listens, the
key it was launched with and the model name it answers to. The chat
([LocalRequest](../chat/router/LocalRequest.md)), the Setup quick chat
([QuickChat](../ipc/QuickChat.md)), the extension slots
([ManagedServers](../../llm-service/service/ManagedServers.md)) and the
localhost API ([LocalApiUpstream](LocalApiUpstream.md)) all read it here.

## Methods

- `LocalServerConnection.of(runtimeServer, status = runtimeServer.getStatus())`
  -> `{ baseUrl, apiKey, model }`:
  - `baseUrl`: `http://<status.host or 127.0.0.1>:<status.port>` (a WSL child
    can move hosts);
  - `apiKey`: the supervisor's launch-time `authKey`, else `null`;
  - `model`: the running plan's `apiModelName`, else `null` (llama-server
    answers to any name).
  `status` is the snapshot a caller already took and checked.
- `LocalServerConnection.ofReady(runtimeServer)`: the same for a server whose
  state is `ready` with a port, else `null` (also for no supervisor, or one
  without `getStatus`).
- `LocalServerConnection.LOOPBACK` = `127.0.0.1`.

## Why

A runtime that serves under its own name refuses any other: Basalt is
launched with `--alias qwen3.8-27b` and answers `The model '<name>' does not
exist` to the pack's file name. The chat read the plan's `apiModelName`; the
extension slots sent the installed file's name from the provider entry, so a
model that answered in the chat failed in the Hub's summaries (2026-11-23).
The localhost API sent the file's name too and failed the same way. One
reader for all four keeps them from disagreeing again, about the name and
equally about the launch key and the host.
