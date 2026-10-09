# MusicRuntimeCatalog

`core/music-server/runtimes/MusicRuntimeCatalog.js`

The music-generation runtime catalog. Extends
[RuntimeCatalog](../../shared/runtime/RuntimeCatalog.md). One entry,
`sglang-omni`, which is a Python package installed into a managed uv venv
(natively on Linux, inside WSL2 on Windows) rather than a GitHub-release binary.

## Methods

- `new MusicRuntimeCatalog()` wraps `MusicRuntimeCatalog.RUNTIMES`.
- `getCatalog()`, `getById(id)`, `platformKey()`, `getAssetPattern(entry)`,
  `getRepo(entry)`, `getCompanionAssetPatterns(entry)`, `getBinaryNames(entry)`,
  `fingerprint()` (inherited).
- `MusicRuntimeCatalog.REQUIREMENT_NOTE` is the host's requirement text: on
  Windows it also names WSL2 with the NVIDIA WSL driver.

## Entry shape

`{ id, name, kind: 'music-inference', description, acquisition: 'python-env',
pythonPackage: { name, version, python, sourceArchive: { ref, url }, extraPackages,
envRevision }, pypi: { project }, platforms, requiresHw, requirementNote, protocol: 'sgl-omni-audio' }`.

## Why

- SGLang-Omni ships on PyPI and is CUDA and Linux only, so acquisition is
  `python-env`. `platforms: ['linux', 'win32']` hides it on macOS (the detector
  filters on it); Windows runs it inside WSL2.
- `pythonPackage` is what the venv installer pins; `pypi` is what the update
  check polls.
- `sourceArchive`: the 0.1.1 wheel (cut 2026-08-08) predates the
  MiniMax-Music3 merge ("Config for MiniMaxMusic3ForConditionalGeneration not
  found"), so installs come from a pinned git-main tarball (main @ 2026-08-15).
  `version` stays the wheel base the update check compares against. When a
  Music3-capable wheel ships, bump `version` and delete `sourceArchive`.
- `extraPackages: ['ninja']`: flashinfer JIT-compiles kernels on first use and
  shells out to `ninja`, which the stack does not declare (live failure #3).
- `envRevision` is bumped when the install recipe changes in a way that makes
  existing venvs incomplete; the runtime card offers a rebuild on mismatch.
- `requirementNote` is read from `process.platform` once when the class loads,
  exactly as the legacy module did at require time.
