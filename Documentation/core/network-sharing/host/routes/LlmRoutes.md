# LlmRoutes

`core/network-sharing/host/routes/LlmRoutes.js`

`/sharing/llm` routes, the OpenAI-compatible surface. Routing only.

## Methods

- `new LlmRoutes(service, auth, { turns, agents })` (`turns`: the router's
  [LiveTurnRegistry](../llm/LiveTurnRegistry.md); `agents`: [SharedAgents](../SharedAgents.md)).
- `mount(router)` adds, each behind `requireToken`:
  - `GET /llm/v1/models`: [LlmModelGate](../llm/LlmModelGate.md)`.modelList`.
  - `POST /llm/v1/chat/completions`: a new [ChatCompletionTurn](../llm/ChatCompletionTurn.md) per request.
  - `POST /llm/v1/chat/abort` (`{ id }`): `{ success: true, id }`, or 404
    `{ error: { message: 'no such turn' } }` for an unknown, finished or
    another client's turn. Stops chat and Responses turns alike.
  - `POST /llm/v1/responses`: a new [ResponsesTurn](../llm/ResponsesTurn.md) per request.
