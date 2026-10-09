# SdServerCapabilities

`core/image-server/service/SdServerCapabilities.js`

What an sd-server binary supports, read from its own `--help` text.

## Methods

- `new SdServerCapabilities({ execFile?, cache? })`; `execFile` defaults to
  `child_process.execFile`, `cache` to a static map shared by every instance.
- `supportsFlag(binaryPath, flag)` the help text contains the flag. A missing
  path or flag is `false` without spawning.
- `autoFitFlagForm(binaryPath)` `'valued'` when the help shows `--auto-fit` next
  to `on|off` (every current upstream release), else `'bare'` (the original switch).
- `helpText(binaryPath)` stdout plus stderr of `<binary> --help` (15 s timeout,
  4 MB buffer, hidden window), cached per path for the process lifetime. A spawn
  that throws reads as `''`.

## Why

sd-server has no feature matrix or version-to-feature table; `--help` is its
only capability surface. Caching makes the probe one spawn per binary rather
than one per launch. Failing closed means the caller skips the newer-build
behaviour, never breaks a launch.
