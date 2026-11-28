# RunGameTool

`extensions/game-mode/tools/assets/RunGameTool.js`

`run_game`: boots the game headlessly ([SmokeRunner](../../smoke/SmokeRunner.md)), drives it with the agent's actions and reports ([SmokeReport](../../smoke/SmokeReport.md)). Always `success: true`. AI games load the live `/play` URL once `gatewayInfo.baseUrl` is known; others run the offline flattened copy. Frames are saved to `.gamedata/smoke/`; a vision-capable model (`chat.visionAvailable(modelRef)`) gets the last frame as `imageBase64`. [ArtStatusNote](../../smoke/ArtStatusNote.md) lines are added to the report naming the art that is not the real image yet (queued to render after the reply, or a placeholder because it failed), so a frame of framed colour boxes is read as missing art.

## Methods

- `new RunGameTool(scope, { modelRef, gatewayInfo })`.
