# CodeArtifactPublisher

`extensions/code-mode/tools/build/CodeArtifactPublisher.js`

Shows each file the build agent writes as a code artifact card in the chat.

## Methods (static)

- `languageFor(relPath)` -> a Monaco language id from the extension (js, ts,
  json, css, html, md ...), `'text'` otherwise.
- `publish(opts, s, relPath, content)`: with `opts.deps.artifactStore`, creates
  a `code` artifact titled with the path, pushes it on `opts.artifacts` (the
  persisted trace) and calls `opts.onArtifact`. A rewrite of the same path
  removes the previous card from the trace and the store first
  (`s.artifacts` maps path -> artifact id). Never throws: the file is already on disk.
