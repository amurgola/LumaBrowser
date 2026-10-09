# StreamPhaseLog

`core/llm-server/chat/router/StreamPhaseLog.js`

Timestamped terminal lines for one local chat request.

## Methods

- `new StreamPhaseLog(now = Date.now)`.
- `line(text)`: `console.log('[llm-chat] +<ms>ms <text>')`.
- `elapsedMs()`.

## Why

Shows whoever runs `npm start` whether the gap before the first token is a restart, a model switch or prompt evaluation.
