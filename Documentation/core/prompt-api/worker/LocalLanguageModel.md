# LocalLanguageModel

`core/prompt-api/worker/LocalLanguageModel.js`

Builds the language model class Electron instantiates for one page's Prompt API
sessions, in the [Prompt API worker](prompt-api-worker.md). Each instance keeps
its session's [PromptConversation](PromptConversation.md) and has every prompt
answered by the main process ([PromptApiService](../PromptApiService.md)), where
the local model is.

## Methods

- `LocalLanguageModel.define(Base, { requests, page })` returns a class
  `LocalModel extends Base`. `Base` is Electron's `LanguageModelUtility` (it
  exists only in a utility process), `requests` a
  [ParentRequests](ParentRequests.md), `page` the calling page's
  `{ webContentsId, origin }`, sent with every request so the main process can
  ask the user about that site in that tab.

The returned class:

- `new LocalModel(conversation)` passes `{ contextUsage, contextWindow: 8192 }` to
  the base.
- `LocalModel.create(options)` first sends `access` with `page` (the main process
  may prompt the user) and rejects when the site is refused; then a new instance
  over `PromptConversation.fromInitialPrompts(options.initialPrompts)`.
- `LocalModel.availability()` asks the main process (`availability`, with `page`).
- `prompt(input)` sends `prompt` with `{ webContentsId, origin, messages }` (the conversation
  plus the input), records the answer, updates `contextUsage`, resolves the
  answer text.
- `append(input)` adds to the conversation and updates `contextUsage`.
- `measureContextUsage(input)` the estimated tokens of `input`.
- `clone()` a new instance over a copy of the conversation.
- `destroy()` nothing to free (the conversation is plain data, the model lives
  in the main process).

There is no streaming method of its own: a streamed prompt arrives as one
chunk. `responseConstraint` is ignored.
