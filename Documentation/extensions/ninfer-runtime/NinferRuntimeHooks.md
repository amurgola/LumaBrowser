# NinferRuntimeHooks

`extensions/ninfer-runtime/NinferRuntimeHooks.js`

The hook object registered with the NInfer runtime row.

## Methods

- `NinferRuntimeHooks.hooks()` returns `{ detect, install, uninstall, planLaunch }`,
  each forwarding its single argument object to
  [NinferDetector](NinferDetector.md)`.detect`,
  [NinferInstaller](NinferInstaller.md)`.install`,
  [NinferUninstaller](NinferUninstaller.md)`.uninstall` and
  [NinferLaunchPlanner](NinferLaunchPlanner.md)`.plan`.

## Why

Core calls each hook with one argument object (`ExtensionRuntimeProbe`,
`RuntimeInstaller`, `PlanFor`). Wrapping keeps the classes' optional second
parameters (`platform`, used by tests) from ever receiving a stray argument.
`planLaunch` stays synchronous because the context estimator calls it once per
context rung.
