# FileStamp

`extensions/game-mode/tools/project/FileStamp.js`

The identity of a file's content on disk, so "you already have this file" is checked against the shared truth (anyone's edit counts), with the same stamps CodeWorkspace's read guard uses.

## Methods

- `FileStamp.of(dir, relPath)` `FileObservation.stampOfText`, else `stampOf(stat)`, else null.
