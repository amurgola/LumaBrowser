# FileChangeTool

`extensions/game-mode/tools/project/FileChangeTool.js`

Base of `edit_file` and `write_file`: `sandboxed` (confined to the conversation's folder, so no approval prompt per file), records the file on the panel, drops the stale whole-read, emits game:state, and builds the write notes.
