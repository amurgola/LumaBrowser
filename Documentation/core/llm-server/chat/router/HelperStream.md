# HelperStream

`core/llm-server/chat/router/HelperStream.js`

Streams one chat request through the helper model's resident llama-server:
the router's own local request path ([LocalRequest](LocalRequest.md) and the
runtime's chat adapter) over the helper service's facade, so the body is the
one the main server gets.

## Methods

- `new HelperStream({ helper, runtimeCatalog, adapterRegistry, request })`;
  `helper` a [HelperModelService](../../helper/HelperModelService.md) (or the
  Lab's double), `request` a LocalRequest seam.
- `stream(stem, messages, temperature, hooks, images, tools, extra)` resolves
  the abort handle; throws `Helper model is not ready.` while the helper is
  off or loading, so the caller (a mode's side call) gets `{ error }` and
  falls back to the main model on its next pick.
