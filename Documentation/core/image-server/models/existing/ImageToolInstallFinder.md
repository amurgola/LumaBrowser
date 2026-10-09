# ImageToolInstallFinder

`core/image-server/models/existing/ImageToolInstallFinder.js`

Finds every other image tool's install on this machine, or only the folders the
caller names.

## Methods

- `ImageToolInstallFinder.find({ env, roots })` returns install records (see
  [ImageToolInstallProbe](ImageToolInstallProbe.md)), deduped by resolved,
  lower-cased directory.
- `execute(roots)` is the instance step behind `find`.
- `INSTALL_NAME_RE`; `ROOTS_ENV` is `LUMA_IMAGE_LIBRARY_ROOTS` (split on the path delimiter).

## Flow

1. An explicit root list (`roots`, else the env variable) replaces discovery.
   Each existing root is probed; a root that is not an install becomes a plain
   checkpoint folder.
2. Otherwise: probe each search parent and each child whose name looks like a
   tool (the regex is loose, the probe decides), then the Stability Matrix
   roots and their `Packages/*`, then the roots ComfyUI configs point at.

## Why

The explicit list replacing discovery is what makes the scan scopable in tests,
and a user who pointed at one folder does not want the rest of the drive searched.
