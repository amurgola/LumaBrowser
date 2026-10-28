# UpdateManifestMerger

`tools/build/release/UpdateManifestMerger.js`

Merges the electron-builder update manifests (`latest.yml`) that separate
per-architecture CI legs write for one platform into the single file
electron-updater reads for that platform. CI builds Windows x64 on
`windows-2022` and Windows arm64 on `windows-11-arm`; each leg's
electron-builder writes its own `latest.yml`, and the release job would
otherwise upload one over the other, leaving one architecture without updates.

## Methods

- `UpdateManifestMerger.merge(primaryText, secondaryTexts)` returns the
  primary's text with every secondary's `files` entries appended to its
  `files:` block, in the order given. The primary keeps its header, `path`
  and `sha512`: electron-updater picks the first `.exe` whose name carries
  `process.arch`, and falls back to the first entry when none does, so the
  x64 manifest (whose installer name carries no arch) is always the primary.
  Throws `Version mismatch` when a secondary's `version:` differs, and
  `has no version line` / `has no files list` for a malformed input.

Text-level on purpose: the `files:` block is every indented line after it,
so unknown keys pass through untouched and the release job needs no YAML
dependency (it runs without `npm ci`).

## Entry

`scripts/merge-update-manifests.js --into <primary> <secondary...>` rewrites
the primary and deletes the secondaries. Exit 1 on a merge error, 2 without
`--into` or a secondary.
