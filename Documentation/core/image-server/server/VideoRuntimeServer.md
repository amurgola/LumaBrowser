# VideoRuntimeServer

`core/image-server/server/VideoRuntimeServer.js`

Supervises the video slot's sd-server child. Extends
[ImageRuntimeServer](ImageRuntimeServer.md) (same binary, `/sdcpp/v1/jobs`
readiness probe and [AuthProxy](AuthProxy.md) fronting) and runs
`BaseRuntimeServerContract`.

## Methods and fields

- `new VideoRuntimeServer({ apiSecurity })`, as ImageRuntimeServer.
- `VideoRuntimeServer.findFreePort(opts)` a free port in the `video` window
  (`VideoRuntimeServer.PORT_RANGE`, 8120-8139); pass `exclude` to keep a
  launch's public and private ports apart.
- `VideoRuntimeServer.SETTLE_TIMEOUT_MS` 600000.

## Hooks

- `_logTag` `[video-server]`, `_processNoun` `sd-server`, `_loadingLabel`
  `video server`.
- `_settleTimeoutMs()` 600 s (the image slot keeps the base 180 s).

## Why

sd-server is one model per process, so the video model gets its own supervisor,
port and GPU like the generation and edit slots, and a resident video model never
evicts them. Video models load far slower than image models; the settle window
is a property of the slot, so no router passes a duration to
`waitUntilSettled`.
