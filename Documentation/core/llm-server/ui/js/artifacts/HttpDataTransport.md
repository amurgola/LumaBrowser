# HttpDataTransport

`core/llm-server/ui/js/artifacts/HttpDataTransport.js`

[ArtifactDataTransport](ArtifactDataTransport.md) over HTTP, for the pop-out
page, the sharing PWA and read-only `/share` views.

## Methods

- `new HttpDataTransport({ base, token?, readOnly?, pollMs? })`. Trailing
  slashes on `base` are dropped.
- `all(rootId, since?)`: `GET <base>/<rootId>?since=<rev>&token=<token>`; a 204
  resolves `{ success: true, unchanged: true }`.
- `mutate(rootId, ops)`: `POST <base>/<rootId>` with the ops as JSON.
- Both send `Content-Type: application/json`, `Authorization: Bearer <token>`
  when a token is set, and `credentials: 'same-origin'`. A non-OK reply passes
  the host's `{ error }` body through, else becomes `{ success: false, error:
  'HTTP <status>' }`; an empty body is `{ success: false, error: 'empty
  response' }`.
- `canPush` is `false` (the store polls every `pollMs`, default 10 s);
  `readOnly` as given.

## Globals

Reads `fetch`.
