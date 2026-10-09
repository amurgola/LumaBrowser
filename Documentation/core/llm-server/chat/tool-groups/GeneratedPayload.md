# GeneratedPayload

`core/llm-server/chat/tool-groups/GeneratedPayload.js`

Decides whether a call to a not-yet-active tool already carries model-generated
content, so the auto-activate bounce lets it through instead of discarding it.

## Members

- `GeneratedPayload.PAYLOAD_TOOLS`: `create_artifact`, `edit_artifact`,
  `create_live_artifact`, `update_artifact_data`, `validate_code`, `send_webhook`.
- `GeneratedPayload.MIN_PAYLOAD_CHARS` (400).
- `GeneratedPayload.carries(toolName, params)`: true only for a payload tool
  whose JSON-serialized params exceed 400 chars. Unserializable params (a
  cycle) are false.

## Why

Bouncing a call discards it. That is free for `read_file {path}` and ruinous
for `create_artifact {content: <a whole README>}`: an artifacts task once spent
its whole 300 s eval budget regenerating without a call landing. An empty probe
(what an inactive stub tells the model to send) still bounces, since nothing is
lost. Tools taking a prompt or query are not listed: re-issuing them is cheap.
