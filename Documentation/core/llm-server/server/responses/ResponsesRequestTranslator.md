# ResponsesRequestTranslator

`core/llm-server/server/responses/ResponsesRequestTranslator.js`

Translates one Responses request into a chat-completions body. Pure.

## Methods

- `translate(body, modelId)` returns
  `{ body, context: { customTools, echo }, dropped }` or `{ error, param }`:
  - `previous_response_id` is refused (`NO_STORED_RESPONSES`); an input that
    yields no message is `input is required`;
  - one leading system message joins `instructions` and every developer/system
    message ([ResponseInputTranslator](ResponseInputTranslator.md));
  - tools via [ResponsesToolTranslator](ResponsesToolTranslator.md);
  - `max_output_tokens` -> `max_tokens`, `temperature`, `top_p`;
  - `reasoning.effort`: `none` -> `enable_thinking: false`, `minimal` -> `low`,
    `low`..`xhigh` -> `reasoning_effort`;
  - `text.format` `json_schema` / `json_object` -> `response_format`;
  - `stream: true` adds `stream_options.include_usage`.
  `store`, `include`, `prompt_cache_key`, `service_tier` and `text.verbosity`
  are accepted and ignored. `echo` comes from [ResponseEnvelope](ResponseEnvelope.md)`.echo`.

## Why

Many chat templates reject a system message after the first turn, so developer
messages are hoisted. The reasoning spellings are the ones
[ThinkingKnobs](../ThinkingKnobs.md) already reads.
