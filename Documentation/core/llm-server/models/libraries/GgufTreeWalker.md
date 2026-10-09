# GgufTreeWalker

`core/llm-server/models/libraries/GgufTreeWalker.js`

Collects adoptable chat-model GGUF files under a directory tree.

## Methods

- `GgufTreeWalker.walk(root, maxDepth, minBytes)` returns
  `[{ path, bytes, file }]` for regular files at most `maxDepth` directories
  below `root` that pass `isAdoptableName` and are at least `minBytes`.
  Unreadable directories are skipped. Symlinked entries inside the tree are not
  followed (a linked root is).
- `GgufTreeWalker.isAdoptableName(fileName)`: a `.gguf` name (any case) that is
  not a later shard (`-0000N-of-0000M` with N other than 1) and not a companion
  (`mmproj*`, `dflash*`, `mtp-*` / `mtp_*`).

## Why

The scanned trees have known shapes, and an unbounded walk over a misconfigured
root (a whole home directory) would hang the wizard, hence the depth cap.
llama.cpp opens shard 1 and finds the rest itself, so listing every shard as a
model would be nonsense. Projectors, bundled drafters and detached MTP heads sit
beside real weights; adopting one would configure a server that cannot load.
