# GamePublisher

`extensions/game-mode/routes/GamePublisher.js`

Publishes a game: flattens it into one `type: html` artifact (served verbatim by `/share/<token>`) in the conversation's artifact list, then mints a share link when sharing and the web backend are up. The link is best effort; its absence is reported, not an error.

## Methods

- `new GamePublisher({ getRouter, getSharing })` (defaults `global.__lumaChatRouter`, `global.__lumaSharingHostService`).
- `publish(root, rawConvId)` -> `{ status, body }`: 503 without an artifact store, 500 on flatten or create failure, else 200 `{ success, artifactId, artifactUrl, bytes, inlinedScripts, inlinedAssets, share: { available, url, reason } }`.

## Change request done

The artifact store comes from `router.getAgentDeps().artifactStore` (legacy called the private `_getAgentDeps()`).
