# ProjectTool

`extensions/game-mode/tools/project/ProjectTool.js`

Base of the game folder's file tools (extends [GameTool](../GameTool.md)): each call scaffolds the session if needed and counts itself; bounded output goes through the turn's read budget.

## Methods

- `new ProjectTool(scope, { truncator, wholeFileMaxBytes, wholeReadChars })`; protected `_session()`, `_code`, `_bounded(text, limitNote)`, `_plural`, `_skippedNote(res)` (names the vendored dirs a search never entered).
