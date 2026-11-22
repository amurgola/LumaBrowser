# ActiveLlamaBuild

`core/llm-server/server/launcher/ActiveLlamaBuild.js`

The llama.cpp build the user runs, as a hint for the side servers that need a llama.cpp build.

## Methods

- `ActiveLlamaBuild.of(llmServerService)`: the active build of the `llama-cpp` framework
  (`llmServerService.frameworkSelection.activeBuild('llama-cpp')`), else
  `getDefaults().runtimeId`, else null. Both members are optional.
- `ActiveLlamaBuild.FRAMEWORK_ID` (`'llama-cpp'`).

Read by [HelperModelService](../../helper/HelperModelService.md),
[GroupRouterService](../../router/GroupRouterService.md),
[GroundingLaunch](../../../grounding-server/GroundingLaunch.md) and
[RpcServerBinary](../../../network-sharing/host/rpc/RpcServerBinary.md). Each keeps
its own preference list and filter to llama.cpp builds; this is only their hint.

## Why

These servers used the stored default runtime id as "the llama.cpp build the user
runs". Since the runtime follows the default model, that id can name Basalt or
another engine, which none of them can use. The llama.cpp framework's active build
is what the user chose for llama.cpp; the stored id stays the fallback for a service
without framework stores and for installs that never chose a build.
