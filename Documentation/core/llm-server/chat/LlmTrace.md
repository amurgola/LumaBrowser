# LlmTrace

`core/llm-server/chat/LlmTrace.js`

One JSON line per model call, per conversation. The transcript stores what the
user saw; this stores what the MODEL saw: the exact request body (so the
prompt is reproducible), what came back, tokens and timing.

```
<appBaseDir>/traces/<conversationId>.jsonl
<appBaseDir>/traces/_side.jsonl          calls with no conversation
```

## Methods

All static; state lives in one shared [LlmTraceWriter](trace/LlmTraceWriter.md).

- `LlmTrace.enabled(db)`: forced for this run, else the `core.llm.traceCalls`
  setting (`db.get(key, false) === true`). A missing or throwing `db` is off.
- `LlmTrace.forced(argv = process.argv, env = process.env)`: true for the
  `--trace-llm` launch flag or `LUMA_TRACE_LLM` set to `1|true|on|yes`.
- `LlmTrace.status(db)`: `{ enabled, setting, forced, flag, env }` for Settings.
- `LlmTrace.instrument({ hooks, tag, model, requestBody })` returns wrapped
  dispatch hooks that record the call when it finishes or fails
  ([LlmCallRecorder](trace/LlmCallRecorder.md)). `tag` is
  `{ conversationId, turnId, callType }`.
- `LlmTrace.record(conversationId, record)`: append one record. Never throws.
- `LlmTrace.deleteFor(conversationId)`: remove its file and rotated sibling.
- `LlmTrace.wipeAll()`: remove the whole traces directory.
- `LlmTrace.sanitizeBody(body)`: see [LlmTraceRecord](trace/LlmTraceRecord.md).
- `LlmTrace.traceDir()`: the directory in use, or `null`.
- `LlmTrace.setDirectory(dir)`: write under `dir` (tests); `null` restores the
  default.
- Constants: `SETTING_KEY`, `FORCE_FLAG`, `FORCE_ENV`, `POINTER_FILE`.

## Record shape

```
{ ts, turnId, callType, model,
  request: { messagesCount, systemChars, tools, params },
  requestBody,
  response: { text, reasoning, toolCalls, finishReason, stopReason, error },
  usage: { promptTokens, completionTokens },
  timings,                       // provider timings, as reported
  timing: { ttftMs, totalMs } }
```

`callType`: chat, compact, title, scheduled, trigger, validation, subagent,
side, sharing.

## Rules

- Never block a turn: all writes are async and errors are swallowed after one
  warning.
- Never store pixels: image parts become size stubs.
- Bounded: text is capped per field, bodies over 2 MB become a preview, and a
  file past 50 MB is rotated to `<id>.1.jsonl` (the previous `.1` is dropped).
- Off by default, because the file is a second, unencrypted copy of every
  prompt and response. `--trace-llm` (`npm run dev:trace`) or `LUMA_TRACE_LLM=1`
  forces it on for one run without touching the stored preference.
- A conversation delete removes its file.
- `luma trace` (`cli/lib/trace/TraceCommand.js`) finds the directory through the pointer file
  `~/.lumabrowser/traces.json`, written on first use.
- Under jest nothing is written unless a test called `setDirectory`.
