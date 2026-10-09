# NinferPrebuiltAcquisition

`extensions/ninfer-runtime/NinferPrebuiltAcquisition.js`

Acquires NInfer from the self-contained prebuilt tarball.

## Methods

- `NinferPrebuiltAcquisition.run(job)` (job: the installer's `{ entry, managedDir,
  installDir, mode, distro, emit, canceled }`) resolves
  `{ source: 'prebuilt', version }`, or `null` when no tarball is available.
  - Reference, first hit: `LUMA_NINFER_PREBUILT`, a non-empty
    `<managedDir>/<asset>` (dropped in by hand or left by an earlier download),
    the entry's (or catalog's) `prebuilt.url`.
  - http(s): emits `resolved`, downloads through core `ResumableDownload`
    (`download` progress, `extract { phase: 'start', label: 'verifying ...' }`).
    A cancel throws `CANCELED`; any other failure emits
    `prebuilt unavailable (<msg>); trying a source build` and resolves null.
  - A local path is copied into the managed dir (testing, air-gapped installs);
    a missing local path resolves null.
  - Extracts with `tar --strip-components=1` into the install dir through
    [NinferStreamingCommand](NinferStreamingCommand.md); cancel throws
    `CANCELED`, failure `EXTRACT_FAILED`.
- `NinferPrebuiltAcquisition.canceledError()`.
