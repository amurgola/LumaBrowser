# GameLookup

`extensions/game-mode/routes/GameLookup.js`

Resolves a request's conversation id to an existing game folder through the extension API's sanitize and folder rules, so every route refuses unknown games the same way.

## Methods

- `GameLookup.find(api, rawConvId, entry = '')` -> `{ convId, root }` or null (the folder, or `entry` inside it, must exist).
