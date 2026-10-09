# RouterClient

`core/llm-server/router/RouterClient.js`

One classify call against the router's llama-server.

## Methods

- `new RouterClient({ http? })` (axios by default).
- `classify({ port, message, timeoutMs })` POSTs `RouterClient.body(message)`
  to `http://127.0.0.1:<port>/completion` and resolves
  `RouterPrompt.parseRouterAnswer(content)`; rejects on transport errors and timeouts.
- `RouterClient.body(message)` `{ prompt: RouterPrompt.buildRouterPrompt(message),
  n_predict: 32, temperature: 0, grammar: RouterPrompt.GRAMMAR, cache_prompt: true, stop: ['<|im_end|>'] }`.

## Why

Greedy decoding constrained by the grammar means a parse never fails, and the
prompt cache keeps the static system block so only the message is evaluated.
See [RouterPrompt](RouterPrompt.md).
