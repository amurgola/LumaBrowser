# WindowsPlatformVersion

`core/browser/identity/WindowsPlatformVersion.js`

The `sec-ch-ua-platform-version` real Chrome would report on this machine.

## Methods

- `WindowsPlatformVersion.detect(platform = process.platform)`: on Windows,
  reads `CurrentBuildNumber` from the registry (`reg query`, 3 s timeout) and
  maps it; elsewhere returns `'15.0.0'`.
- `WindowsPlatformVersion.fromBuild(build)`: the
  `Windows.Foundation.UniversalApiContract` major for that build as `'N.0.0'`
  (26100 -> 19, 22621 -> 15, 22000 -> 14, 19041 -> 10, ..., 10240 -> 1). Builds
  below 10240 or unreadable give `'15.0.0'`.
- `WindowsPlatformVersion.parseBuildNumber(regOutput)`: the build from `reg query` output, or 0.

## Why the registry

Both `os.release()` and `process.getSystemVersion()` can report the
compatibility-shimmed 6.2.9200. Reporting the host's true value keeps the
header, `userAgentData` and workers in agreement; a hardcoded Win11 value
contradicted Win10 hosts. Non-Windows hosts get a common Win11 value because the
UA claims Windows regardless.
