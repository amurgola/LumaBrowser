# ArtifactRoutes

`core/network-sharing/host/routes/ArtifactRoutes.js`

`/sharing` artifact routes. Routing only; the work is in
[SharedArtifacts](../SharedArtifacts.md).

## Methods

- `new ArtifactRoutes(service, auth)`; `mount(router)` adds:
  - `GET /artifacts/:id` (`requireToken`): `describe(id)`.
  - `GET /artifacts/:id/view` (browser credential, text errors): the rendered
    HTML (`text/html; charset=utf-8`) or 404 `Artifact not found` as text.
  - `GET /artifact-data/:rootId[?since=rev]` (browser credential): `data(...)`, 204 when unchanged.
  - `POST /artifact-data/:rootId` (browser credential): `mutate(...)`.

## Why

The view is an iframe document and the data routes are fetched from inside
artifact iframes riding the document's cookies, so they cannot carry an
Authorization header.
