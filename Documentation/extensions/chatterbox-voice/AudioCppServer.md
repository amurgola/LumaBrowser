# AudioCppServer

`extensions/chatterbox-voice/AudioCppServer.js`

Supervises one audiocpp_server child. Extends core
[BaseRuntimeServer](../../core/shared/runtime/BaseRuntimeServer.md), which owns
spawn, health wait, idle unload and stop.

## Hooks

- `_logTag()` `'[chatterbox]'`, `_processNoun()` `'audiocpp_server'`,
  `_loadingLabel()` `'voice engine'`.
- `_healthCheck()` resolves true when `GET /health` on the server port answers
  2xx-4xx within 1.5 s.

Launches come from [AudioCppLaunch](AudioCppLaunch.md). Its test runs
`BaseRuntimeServerContract`.
