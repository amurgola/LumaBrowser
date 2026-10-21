# WindowsPlatformVersion

`core/browser/identity/WindowsPlatformVersion.js`

The `sec-ch-ua-platform-version` real Chrome would report on this machine.

## Methods

- `WindowsPlatformVersion.detect(platform = process.platform)`: on Windows,
  maps the `CurrentBuildNumber` registry value (`reg query`, 3 s timeout) and
  caches it; elsewhere returns `'15.0.0'`. The build comes from a finished
  `prefetch` when there is one, else from a synchronous read.
- `WindowsPlatformVersion.prefetch(platform = process.platform)`: starts the
  registry read in the background and resolves the build (0 when unknown). On
  a non-Windows host or once the build is known it resolves at once. Called at
  the bottom of ChromeIdentity, so the read runs off the boot path.
- `WindowsPlatformVersion.fromBuild(build)`: the
  `Windows.Foundation.UniversalApiContract` major for that build as `'N.0.0'`
  (26100 -> 19, 22621 -> 15, 22000 -> 14, 19041 -> 10, ..., 10240 -> 1). Builds
  below 10240 or unreadable give `'15.0.0'`.
- `WindowsPlatformVersion.parseBuildNumber(regOutput)`: the build from `reg query` output, or 0.

## Why prefetch

The synchronous `reg query` took about 25 ms and ran at module load, which
happens before the window exists; it was the only child process on that path.
The hints that need the value are first built on the first page request, by
which time the background read has long finished, so nothing waits on it.

## Why the registry

Both `os.release()` and `process.getSystemVersion()` can report the
compatibility-shimmed 6.2.9200. Reporting the host's true value keeps the
header, `userAgentData` and workers in agreement; a hardcoded Win11 value
contradicted Win10 hosts. Non-Windows hosts get a common Win11 value because the
UA claims Windows regardless.
