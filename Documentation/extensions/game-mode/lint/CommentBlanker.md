# CommentBlanker

`extensions/game-mode/lint/CommentBlanker.js`

Blanks `//` and block comment bodies with spaces while keeping every offset and newline, so lint findings map onto the source and prose in comments never fires. String literals are tracked; regex literals are not (the safe direction).

## Methods

- `CommentBlanker.blank(src)`.
