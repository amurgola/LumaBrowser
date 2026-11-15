# ParentRequests

`core/prompt-api/worker/ParentRequests.js`

Request and reply over a utility process's parent port, used by the
[Prompt API worker](prompt-api-worker.md) to ask the main process
([PromptApiService](../PromptApiService.md)) for answers.

## Methods

- `new ParentRequests(port)`: `port` is `process.parentPort` (`postMessage`, and
  `message` events whose `data` is the message).
- `send(method, params)` posts `{ type: 'request', id, method, params }` with a
  new id and resolves with the `result` of the `{ type: 'reply', id }` message
  for that id, or rejects with its `error`. Other messages and unknown ids are
  ignored.
