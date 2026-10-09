# ReadFileTool

`extensions/game-mode/tools/project/ReadFileTool.js`

`read_file`: a whole file in one call when it fits the whole-file cap (marked `COMPLETE FILE`, `noCompact`), else a bounded page whose header and continuation name the real file line range. A file already served whole, unchanged on disk and with less than `wholeReadChars` served since, is refused with "You ALREADY have the COMPLETE contents". Its `onResultEvicted` clears that claim.
