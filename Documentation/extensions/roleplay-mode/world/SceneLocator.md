# SceneLocator

`extensions/roleplay-mode/world/SceneLocator.js`

Finds roleplay scenes in a conversation's persisted data.

## Methods

- `SceneLocator.active(data)` the scene of `currentState.sceneId`, else
  `activeSceneId`, else the first scene, else null.
- `SceneLocator.byName(data, name)` case-insensitive, or null.
- `SceneLocator.label(scene)` `"name: description"`, the duplicate dropped when
  both are the same text; `''` for no scene.
