# ContainerPath

`core/shell/ContainerPath.js`

Parses and builds the host-side spelling of a path inside a running Docker container.

## Methods

- `ContainerPath.parse(hostPath)` returns `{ container, posix }` or `null` for a host path. Accepts
  `\\docker\<name>\<path>`, `//docker/<name>/<path>` (any case) and `/.luma-docker/<name>/<path>`. Trailing slashes are
  trimmed; the container root is `/`.
- `ContainerPath.isContainerPath(hostPath)` is `parse(...) !== null`.
- `ContainerPath.toHostPath(container, posix, platform = process.platform)` spells the path for this platform.
- Constants: `WIN_PREFIX`, `POSIX_PREFIX`, `UNC_PREFIX`.

## Why

A container workspace keeps every host file tool and only changes where the bytes live. The spelling is UNC-shaped on
purpose, so `path.resolve`, `path.relative` and the containment checks built on them keep working unchanged.
