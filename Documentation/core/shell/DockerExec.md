# DockerExec

`core/shell/DockerExec.js`

Runs one synchronous `docker exec` into a container and returns its status and output without throwing.

## Methods

- `DockerExec.exec(container, argv, { input, timeoutMs, workdir })` returns `{ status, stdout: Buffer, stderr: string,
  error }`. Adds `-i` only when `input` is given and `-w <workdir>` when set. A spawn failure reads as `status: null`
  with `error` set. Default timeout 60 s, max buffer 64 MiB.
- `DockerExec.sh(container, script, params, options)` runs `sh -c script sh ...params`, so params arrive as `$1`, `$2`
  and never need shell quoting.
- `DockerExec.dockerBin()` is `process.env.LUMA_DOCKER_BIN || 'docker'`.
- `DockerExec.setSpawnSync(fn)` swaps the spawner (tests); `null` restores `child_process.spawnSync`.

## Why

Synchronous on purpose: it backs the synchronous fs subset CodeWorkspace uses. One exec costs a few hundred
milliseconds, so tree-wide work goes through [ContainerSearch](ContainerSearch.md) instead of many calls.
