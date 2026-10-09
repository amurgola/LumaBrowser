# ResponsesCompletion

`core/llm-server/server/responses/ResponsesCompletion.js`

Runs one non-streaming Responses request: a [TranslatedChatCompletion](../relay/TranslatedChatCompletion.md)
answering [ResponsesResponseTranslator](ResponsesResponseTranslator.md)`.translate`.
Errors are OpenAI-shaped: `server_error` for status >= 500, else
`invalid_request_error`, with code `context_length_exceeded` for an overflow.
Logs as `responses upstream failed: ...`.
