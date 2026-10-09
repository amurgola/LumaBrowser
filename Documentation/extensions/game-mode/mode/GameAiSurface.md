# GameAiSurface

`extensions/game-mode/mode/GameAiSurface.js`

The in-game AI surface routes reach through `extensionApi.ai`, working from the persisted setup since routes have no turn.

## Methods

- `bridge` the [AiBridge](../ai/AiBridge.md).
- `kindFor(id)` setup meta first, game.json as the fallback.
- `framingFor(id)` the bridge framing with game.json's name as the fallback.
- `storeFor(id)` the game's [GameDataStore](../store/GameDataStore.md).
- `runtimeImage(id, params)` [RuntimeAssetGenerator](../assets/RuntimeAssetGenerator.md) with the setup style and pins; the session is scaffolded when `context.code` exists, else a minimal record is used.
