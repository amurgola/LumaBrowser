# SharedArtifacts

`core/network-sharing/host/SharedArtifacts.js`

Host-side artifacts for paired clients. Generated files live on the host with
127.0.0.1 URLs a client cannot reach, so the client fetches them here by id.
Methods return `{ status, body }` replies for [RouteReply](routes/RouteReply.md).

## Methods

- `new SharedArtifacts(service)` (`getChatRouter`).
- `describe(id)`: 404 `{ error: 'artifact not found' }`, else `{ id, title,
  type, mime, language, content }`; for images `mime` is the stored language
  (default `image/png`), `language` null and `content` base64.
- `html(id)`: the rendered document via `getArtifactHtml(id, { webBase: '',
  dataEndpoint: '/sharing/artifact-data' })`, or null.
- `data(rootId, since)`: 503 without live-data support, 404 with the snapshot
  when it fails, 204 when `since` parses and `rev <= since`, else 200 with it.
- `mutate(rootId, body)`: passes only `set` and `remove`; 200 or 400 by the result's `success`.

## Why

`webBase: ''` gives same-origin `/llm-ui` and `/sharing` paths that work on
every mount and from a remote device. Paired clients are the authenticated
user, so live data is read-write for them (public share links are read-only).
