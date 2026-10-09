# ContainerTools

`core/shell/shellClassifier/rules/packages/ContainerTools.js`

[ToolFamily](ToolFamily.md) for `docker`, `podman`, `nerdctl` and the `docker-compose` / `podman-compose` front ends.

## Table

- Data loss: `system prune --volumes`, `system reset`, `volume prune|rm`, compose `down -v|--volumes`, compose `rm -v`.
- Bulk cleanup: `system prune`, `image|container|network|builder|buildx prune`, compose `down --rmi`.
- Disruption: `rm -f` / `container rm --force` (stops running containers).
- Unconfirmed removal: `rmi -f` / `image rm --force`, compose `rm -f`.
- Host exposure: `run|create --privileged`; `run|create` bind-mounting the host root (`-v /:/x`, `--volume=C:\:/c`,
  `--mount type=bind,source=/,...`).

Compose rows are written once and reached both as `docker compose <row>` and `docker-compose <row>`.

## Methods

- `ContainerTools._mountsHostRoot(toolArgs)`, `_bindSource(spec)` (keeps a drive letter's colon; no colon means an
  anonymous volume), `_mountSource(spec)` (`source=` / `src=`).
