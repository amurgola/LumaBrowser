# PromptConversation

`core/prompt-api/worker/PromptConversation.js`

One Prompt API session's conversation, kept as chat messages
(`{ role, content }`): the page's initial prompts, then every prompt and answer
since. Used by [LocalLanguageModel](LocalLanguageModel.md) in the
[Prompt API worker](prompt-api-worker.md).

## Methods

- `new PromptConversation(messages = [])` copies the messages.
- `PromptConversation.fromInitialPrompts(initialPrompts)` from
  `LanguageModel.create()`'s `initialPrompts`, or empty.
- `PromptConversation.toChatMessages(input)` turns `LanguageModelMessage[]`
  (`{ role, content: [{ type, value }] }`, or a string `content`) into
  `[{ role, content }]`. A role outside `ROLES` (`system`, `user`, `assistant`)
  becomes `user`. Text only: a part whose `type` is not `text` (a picture,
  audio) throws "The local model takes text only".
- `PromptConversation.estimateTokens(messages)` characters / `CHARS_PER_TOKEN` (4),
  rounded up.
- `withInput(input)` everything so far plus the new input, without keeping it.
- `record(input, answer)` the prompt was answered: input and answer (as
  `assistant`) join the conversation.
- `append(input)` messages added without asking for an answer
  (`LanguageModel.append()`).
- `messages()` copies; `usage()` the estimated tokens; `clone()` an independent copy.
- `CONTEXT_WINDOW` 8192: the nominal figure pages budget against; the worker
  does not know the loaded model's real window.
