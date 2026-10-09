# NinferSourceBuild

`extensions/ninfer-runtime/NinferSourceBuild.js`

Builds NInfer from the pinned upstream commit when no prebuilt is available.

## Methods

- `NinferSourceBuild.run(job)` resolves `{ source: 'source-build', version: <commit> }`:
  1. [NinferToolchain](NinferToolchain.md)`.check`; anything missing throws
     `NINFER_TOOLCHAIN_MISSING` naming the tarball to drop in, the missing
     pieces and `APT_HINT`, with `detail { missing, found, probeError, mode, distro }`.
  2. Emits `resolved` (`source build @ <commit>`) and `extract { label: 'cloning' }`,
     writes `build-ninfer.sh` and `ninfer-serve-wrapper.sh` ([NinferScripts](NinferScripts.md)).
  3. Runs `clone` (15 min, `CLONE_FAILED`), `build` (60 min, `BUILD_FAILED`) and
     `pack` (5 min, `PACKAGE_FAILED`). A cancel during clone or build throws
     `CANCELED`; during pack it reports as a packaging failure, as in legacy.
- Statics: the three timeouts and `APT_HINT`.
