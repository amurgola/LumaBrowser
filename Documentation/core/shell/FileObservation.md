# FileObservation

`core/shell/FileObservation.js`

Per-workspace ledger of what the coding agent has actually seen on disk, plus the identity stamps that decide
whether that is still true.

## Methods

- `FileObservation.stampOfText(text)` returns `c:<sha1>` for a string, or `null` for anything else. This is the
  preferred identity.
- `FileObservation.stampOf(stat)` returns `s:dev:ino:size:mtimeMs:ctimeMs` from an `fs.Stats`-like object (missing or
  non-finite fields count as 0), or `null` for no stat. The fallback when the text cannot be read.
- `FileObservation.key(absPath)` normalizes a path to a ledger key (resolved; lowercased on Windows).
- `new FileObservation()`
- `ledger.observe(absPath, stamp)` records a stamp (ignored when the stamp is empty).
- `ledger.get(absPath)` returns the last stamp, or `undefined`.
- `ledger.forget(absPath)`, `ledger.forgetUnder(absDir)`, `ledger.clear()` drop entries.
- `ledger.size` is the number of entries.

## Why

The coding agent runs unattended: `write_file` is a full overwrite and `edit_file` matches literals against current
content. Both are only safe while the model's picture of the file matches disk, which stops being true when a sibling
sub-agent, the user's editor or a build step rewrites the file. CodeWorkspace asks this ledger "has it changed since
it was read?" before either mutation.

Content, not metadata, is the identity. A five-character rename keeps size and inode, and inside one filesystem tick
keeps mtime too, so a stat stamp reads a changed file as untouched (this made a cross-agent test flaky and, in
production, let a full write silently revert a sibling's work). Hashing costs a read callers have almost always
already paid. The `c:` and `s:` prefixes keep the two kinds from ever comparing equal, so a fallback reads as
"changed", which is the safe direction.

`stampOf` folds every cheap field because none is trustworthy alone: Windows often reports `ino` 0, and `mtimeMs`
alone misses a same-millisecond rewrite of a different size. Ledger keys fold `./a/b`, `a\b` and `a/b` into one
entry (a miss reads as "never read" and would reject a legitimate edit), and fold case on Windows because NTFS is
case-insensitive. `forgetUnder` exists because a later workspace could recreate the same paths.

The class only stores; callers decide when to touch the filesystem.
