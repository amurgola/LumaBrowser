# RuntimeDetector

`core/shared/runtime/RuntimeDetector.js`

Base class for the binary runtime detectors. Finds every catalog runtime of one
kind on this host and reports install source, version, acquisition path and
hardware readiness. Fail-soft and offline.

## Methods

- `new RuntimeDetector({ catalog, expectedKind })`; throws without either.
- `expectedKind` getter.
- `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })` resolves
  `{ runtimesRoot, platformKey, runtimes }`. For each entry of
  `expectedKind` whose `platforms` (if any) include this host:
  1. extension entries with a `detect` hook go through
     [ExtensionRuntimeProbe](detect/ExtensionRuntimeProbe.md); everything else
     through [BinaryRuntimeProbe](detect/BinaryRuntimeProbe.md)
     (registered binary, managed dir, PATH);
  2. [RuntimeDetailFields](detect/RuntimeDetailFields.md) stamps entry facts,
     acquisition, `installable` and `hardware`;
  3. `_decorateDetail(detail, entry)` runs.
  Then `_rollUp({ entries, detectedById, results })` may append rows.
- `parseVersionOutput(stdout, stderr)` **must be implemented**: the version
  label from a clean `--version` run, or `null`. The base throws.
- `readVersion(binaryPath)` runs [VersionProbe](detect/VersionProbe.md) with
  `parseVersionOutput`. Override only for runtimes that cannot be probed that
  way; a bare string or null return is still accepted.
- `_decorateDetail(detail, entry)`, `_rollUp(ctx)`: optional hooks, no-ops in
  the base.

## Why

The LLM and image detectors shared everything except the version parser, the
image server's protocol tag and the LLM server's format roll-up. Those three
are now the subclass hooks.

The music detector deliberately does not extend this: a python-env runtime is
"installed" when its venv exists, possibly inside WSL where fs cannot look. It
can still reuse `RuntimeHardwareCheck.cudaUnavailableNote` and
`RuntimeManifest.read`.
