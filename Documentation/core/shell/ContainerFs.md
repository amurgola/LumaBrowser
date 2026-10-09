# ContainerFs

`core/shell/ContainerFs.js`

The synchronous fs subset CodeWorkspace uses, served from inside a Docker container, plus a routed fs that sends
container paths here and every other path to the real filesystem.

## Methods

- `ContainerFs.routed(realFs)` returns a Proxy over `realFs`: for the methods in `ContainerFs.METHODS`, a container
  path (see [ContainerPath](ContainerPath.md)) goes to the container and anything else to `realFs`. Other members pass
  through untouched.
- fs subset, each taking a container path first and throwing fs-style errors (`code`, `path`):
  - `statSync(p)` returns a Stats-like object (`size`, `mtimeMs`, `ctimeMs`, `mtime`, `mode`, `dev: 0`, `ino: 0`,
    `isDirectory()`, `isFile()`, `isSymbolicLink()`). Missing is `ENOENT`; docker failure is `EIO`.
  - `existsSync(p)` is false for host paths without calling docker.
  - `readFileSync(p, options)` returns a Buffer, or a string with an encoding. `ENOENT`, `EISDIR`, `EIO`.
  - `writeFileSync(p, data, options)` streams the bytes over stdin (`cat > "$1"`).
  - `mkdirSync(p, { recursive })`, `readdirSync(p, { withFileTypes })`, `rmSync(p, { recursive, force })`.
    `rmSync` refuses the container root with `EPERM`.
  - A host path given directly is `EINVAL`.
- `ContainerFs.list(container, posix, verbPath)` lists one directory level as `[{ type: 'd'|'f', bytes, name }]`.

## Why

A container workspace keeps every host file tool and changes only where the bytes live. `dev` and `ino` are 0
because a container gives no stable identity; FileObservation treats 0 as just another field and prefers content
hashes anyway.
