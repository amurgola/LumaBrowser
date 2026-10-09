# ResponsesResponseTranslator

`core/llm-server/server/responses/ResponsesResponseTranslator.js`

Non-streaming chat completion to Responses object. Pure.

## Methods

- `translate(completion, modelId, context)` a [ResponseEnvelope](ResponseEnvelope.md)
  `finished` object whose output is, in order, a reasoning item (from
  `reasoning_content`), a message (from `content`) and one tool-call item per
  `tool_calls` entry ([OutputItems](OutputItems.md)`.toolCall`; `call_id` is the
  upstream id or a minted one).
