# MediaLaunchPlanner

`core/media-shared/MediaLaunchPlanner.js`

Base class for the pure launch planners that turn a model, a runtime and
options into a child-process argv. Every planner returns
`{ binaryPath, args, plan }`.

## Methods

- `plan(options)` stores `options` (null becomes `{}`), then runs
  `_validate()`, `_resolveSettings()`, `_buildArgs()`, `_resolveBinaryPath()`
  and `_describePlan(args)`, returning `{ binaryPath, args, plan }`.

Protected hooks:

- `_validate()`, `_buildArgs()`, `_resolveBinaryPath()`, `_describePlan(args)`
  are abstract and throw `<ClassName> must implement ...`.
- `_resolveSettings()` is optional, for values both the argv and the plan need.
- `_requireOption(name)` throws `<ClassName>: <name> is required` when the
  option is falsy.

A planner instance can be reused: each `plan()` call resets its state from the
new options.

## Implementations

- `core/image-server/server/ImageLaunchPlanner.js`
- `core/whisper-server/server/WhisperLaunchPlanner.js`
- `core/music-server/server/MusicLaunchPlanner.js`
- `core/llm-server/server/MlxLaunchPlanner.js`

## Why

The runtime servers spawn whatever `{ binaryPath, args }` a planner returns, so
the shape is a real interface. The steps are fixed so every planner reads the
same way: validate, resolve, build, describe.
