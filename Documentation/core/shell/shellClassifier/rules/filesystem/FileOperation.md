# FileOperation

`core/shell/shellClassifier/rules/filesystem/FileOperation.js`

Base class for one family of file-destroying operations.

## Methods

- `constructor({ verb, protectedKinds })`: `verb` completes "would ___ a root or system directory";
  `protectedKinds` (default all of root, home, system) are the path kinds that make it forbidden.
- Subclasses implement `covers(command)`, `targets(command)`, `sweepReason(command)`; may override
  `reachesTargets(command)` (default true) and `unconditionalReason(command)` (default null).
- `judge(command)`: forbidden for an unconditional reason or a reached protected target (reason quotes the
  [SystemPaths](../../SystemPaths.md) finding), else mass-destructive for a sweep, else `null`.
- `FileOperation.hasWildcard(targets)`.

## Why

Deletes, mirrors and permission rewrites all have the same shape: what they cover, where they land, whether they
really reach it, and whether they sweep many files. Profiles only answer those questions.
