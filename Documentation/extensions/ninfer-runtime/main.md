# ninfer-runtime (manifest.js, main.js)

`extensions/ninfer-runtime/manifest.js`, `extensions/ninfer-runtime/main.js`

The NInfer runtime add-on: NInfer, a from-scratch C++/CUDA inference server
compiled for the RTX 5090 only (sm_120a), as an optional LLM runtime, plus the
Qwen NInfer artifacts it loads as one-click add-on models. On Windows the server
runs inside WSL2; on Linux it runs natively. `private` and `distributable`.

## Entry

- `manifest.js` keeps the legacy id, fields and text; `main: './main.js'`, no dependencies.
- `main.js` exports `{ activate(context), deactivate() }`; `activate` delegates
  to [NinferActivation](NinferActivation.md); `deactivate` does nothing because
  the extension manager unregisters everything.

## Flow

1. Activation registers the row from [NinferCatalog](NinferCatalog.md) with the
   [NinferRuntimeHooks](NinferRuntimeHooks.md) and the
   [NinferModelEntries](NinferModelEntries.md) rows.
2. The runtimes view calls `detect` ([NinferDetector](NinferDetector.md)).
3. Install ([NinferInstaller](NinferInstaller.md)) resolves WSL, tries the
   prebuilt tarball ([NinferPrebuiltAcquisition](NinferPrebuiltAcquisition.md)),
   else builds from source ([NinferSourceBuild](NinferSourceBuild.md)), then
   probes the GPU ([NinferGpuProbe](NinferGpuProbe.md)) into
   [NinferManifest](NinferManifest.md).
4. Launch is planned synchronously by [NinferLaunchPlanner](NinferLaunchPlanner.md)
   and supervised by the core LLM runtime server (no BaseRuntimeServer subclass here).

The runtime bases do not fit: core's RuntimeInstaller and RuntimeDetector route
`acquisition: 'extension'` rows to these hooks, so the hooks are the
extension-side halves of those seams, not subclasses.

An installed NInfer keeps its files (managed dir and the distro-side install)
when the extension is disabled, but drops out of the runtime list.
