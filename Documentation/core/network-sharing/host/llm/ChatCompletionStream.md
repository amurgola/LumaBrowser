# ChatCompletionStream

`core/network-sharing/host/llm/ChatCompletionStream.js`

Writes one shared chat turn in the OpenAI chat.completions wire format over an
[SseChannel](SseChannel.md).

## Methods

- `new ChatCompletionStream(res, { model, wantStream })`: mints
  `chatcmpl-<16 hex>` and the creation second.
- `chunk(delta, finish)`: a `chat.completion.chunk` with one choice.
- `usage(usage)`: a chunk with `choices: []` and `usage` (skipped when null).
- `event(event, payload)`: `{ object: 'luma.event', event, payload }`; dropped when not streaming.
- `finish(finishReason, usage)`: optional usage chunk, the finish chunk, `[DONE]`.
- `completion(content, finishReason, usage)`: the non-stream
  `chat.completion` body (`usage` omitted when null).
