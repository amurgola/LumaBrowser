# MusicLaunchPlanner

`core/music-server/server/MusicLaunchPlanner.js`

Plans the `sgl-omni serve` launch for a music model. Extends
[MediaLaunchPlanner](../../media-shared/MediaLaunchPlanner.md) and runs its
contract. There is no KV math or layer offload: the placement decision is
"which card(s)", made by [VramCoordinator](../../shared/runtime/VramCoordinator.md)
and checked by [MusicVramShortfall](MusicVramShortfall.md); the per-shape serve
flags come from the catalog row's `launchProfiles`.

## Methods

- `new MusicLaunchPlanner({ vramCoordinator = VramCoordinator.shared, platform = process.platform })`.
- `plan({ runtimeRow, model, modelPath, port, extraServeArgs = [], settingsDb?, diagnostics? })`
  returns `{ binaryPath, args, plan, cudaDevice, healthTimeoutMs }`.
  - Requires `runtimeRow`, `model`, `modelPath`, `port` (`MusicLaunchPlanner: <name> is required`).
    The entrypoint is `runtimeRow.manifest.binPath`, else `runtimeRow.binaryPath`;
    none throws `Music runtime is not installed (no sgl-omni entrypoint).` before
    anything is reserved.
  - Mode is `manifest.mode`, else `wsl` on win32 and `native` elsewhere; distro
    is `manifest.distro` or null.
  - Reserves `{ serverId: 'music', role: 'music', requiredBytes: colocated floor
    (model.minVramBytes, else 34 GB), allowSplit: model.dualGpuOk }`.
  - Refuses (releasing `music` first) an offload reservation with
    `Not enough free GPU memory for music generation right now. <advice>` and a
    shortfall with `... right now (<shortfall>). <advice>`, where the advice is
    `Stop or unload other model servers and try again, or pin music to specific
    GPUs with the core.musicServer.cudaDevice setting.`
  - Profile `dual` when `model.dualGpuOk` and two or more devices are reserved,
    else `single`; its `launchProfiles` args follow the serve args, then `extraServeArgs`.
  - Serve args: `serve --model-path <runtime path> --host 0.0.0.0 --port <port> ...profile ...extra`.
  - Native: `binaryPath` is the entrypoint, `cudaDevice` is the reservation's.
  - WSL: `binaryPath` is `C:\Windows\System32\wsl.exe`, args are
    `[-d <distro>]? -- bash -lc "exec env PATH='<venv bin>':"$PATH" CUDA_VISIBLE_DEVICES=<pin> '<entrypoint>' '<arg>'..."`
    (each part only when present), the model path is translated with
    `WslFormat.toWslPath`, and `cudaDevice` is null.
  - `plan` is `{ port, host: '127.0.0.1', mode, distro, modelId, runtimeId,
    modelPath, apiModelName, cudaDevice, devices, profile }`, where
    `apiModelName` is the runtime-side `--model-path` string.
  - `healthTimeoutMs` is 20 min when the runtime model path starts with `/mnt/`,
    else 8 min.
- Statics: `SERVER_ID`, `ROLE`, `WSL_EXE`, `HEALTH_TIMEOUT_MNT_MS`,
  `HEALTH_TIMEOUT_NATIVE_MS`, `SERVE_HOST`, `CLIENT_HOST`,
  `NOT_INSTALLED_MESSAGE`, `NO_ROOM_MESSAGE`, `NO_ROOM_ADVICE`.

## Why

- The reservation asks for the colocated floor, not the dual AR share: with one
  visible GPU sgl-omni puts both stages on it, so a card that fits only the AR
  share fills to zero before the KV pool is sized (live failure #4). Asking for
  the full bytes makes "one card if it fits" honest and pushes smaller boxes to
  the two-card split, where the stages separate.
- sgl-omni cannot stream weights from system RAM, so the coordinator's RAM tier
  would only crash minutes into the load; it is refused up front.
- Under WSL, env set on the Windows process does not cross into the distro, so
  `PATH` (flashinfer's JIT shells out to the venv's `ninja`) and
  `CUDA_VISIBLE_DEVICES` are embedded in the command string, and `exec` makes
  bash replace itself so the server is the session's direct child. Setting
  `launch.cudaDevice` there would pin only the Windows side.
- The server registers the model under the exact `--model-path` it started
  with, so requests send that string as `model`.
