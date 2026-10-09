# SetupArt

`extensions/roleplay-mode/world/SetupArt.js`

The canonical character-art and scene SETUP prompts shared by the setup modal,
the server and the Roleplay Lab, and their compose order.

## Methods

- `SetupArt.PROMPTS` `{ basePrefix, baseSuffix, scenePrefix, fullBody, emotions: { happy, sad, angry } }` (frozen).
- `SetupArt.compose(data, char, extra, { context?, subject? })`
  `[basePrefix, style, scenario (first 160 chars)?, description?, extra]`,
  blanks dropped, joined with `, `.
- `facePrompt(data, char)` context and subject plus `baseSuffix`;
  `fullBodyPrompt` subject only plus `fullBody`; `emotionPrompt(data, char, emotion)`
  neither, unknown emotions use `happy`; `scenePrompt(data, scene)`
  `[scenePrefix, style, scene.description]`.
