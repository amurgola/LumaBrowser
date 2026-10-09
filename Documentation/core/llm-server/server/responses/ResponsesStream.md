# ResponsesStream

`core/llm-server/server/responses/ResponsesStream.js`

Runs one streaming Responses request: a [TranslatedChatStream](../relay/TranslatedChatStream.md)
whose translator is a [ResponsesStreamTranslator](ResponsesStreamTranslator.md)
built with the request `context` (custom tools, echo). Upstream failures become
`response.failed`.
