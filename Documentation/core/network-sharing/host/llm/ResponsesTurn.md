# ResponsesTurn

`core/network-sharing/host/llm/ResponsesTurn.js`

`POST /sharing/llm/v1/responses`: an OpenAI Responses API shim over the same
chat proxy. A [SharedLlmTurn](SharedLlmTurn.md).

## Methods

- `new ResponsesTurn(service, turns)`; `run(req, res)`.

## Behaviour

- JSON unless `stream: true` (the OpenAI default, unlike chat/completions).
- Validation: no `model` 400 `model is required`; input that
  [ResponsesInput](ResponsesInput.md) cannot turn into at least one message
  400 `input is required`; [LlmModelGate](LlmModelGate.md) 403; no chat router 503.
- Dispatch: `proxyStream({ modelRef, messages, temperature, hooks, images,
  extra })` with the same thinking knobs as chat/completions.
- Hooks: text deltas only; reasoning and status are swallowed, but `onStatus`
  must exist because the router calls it unguarded during a cold boot.
- Streaming ([ResponsesStream](ResponsesStream.md)): `response.created` and
  `response.in_progress` before dispatch, item events around the deltas,
  `response.completed` at the end; cancel ends with `response.incomplete`
  (`incomplete_details: { reason: 'cancelled' }`), a mid-stream error with
  `response.failed`. Errors before output are 502 `{ error: { message, type: 'server_error' } }`.
- Not supported: tools and function items, `previous_response_id`, stored responses.
