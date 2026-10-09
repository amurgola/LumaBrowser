# DiscardBuildTool

`extensions/code-mode/tools/build/DiscardBuildTool.js`

`discard_build {}` (a [CodeTool](../CodeTool.md); name-gated by the approval gate).

## Behaviour

- No build: `{ success: true, message: 'There is no build to discard.' }`.
- An installed build is refused: it can only be removed from the Extensions area.
- Otherwise `context.code.discardWorkspace` (best effort), forget the session,
  emit `build:state` null, and say a new build can start with write_extension_file.
