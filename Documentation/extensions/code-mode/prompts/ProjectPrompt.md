# ProjectPrompt

`extensions/code-mode/prompts/ProjectPrompt.js`

The project-mode system prompt: the Code agent in an existing folder.

## Methods (static)

- `build(data, opts)` joins, in order: the project identity, `<agent_persona>`
  (opts.persona), `project(data.projectPath)`, `<terminal>` when
  `data.origin === 'terminal'`, `opts.contextFiles`, the project or no-tool
  workflow, `<commands>` when `hasTools && hasCommand`, `parallelism(opts.batchConcurrency)`
  when tools are on, the validation note, and the goal. A terminal session with
  no task gets no goal (each message is the instruction); otherwise a missing
  task asks the user for one.
- `project(projectPath)` -> `<project>` naming the root; for a container path
  (see ContainerPath) it names the path INSIDE the container and that commands
  run in the container's bash. Null without a path.
- `parallelism(concurrency)` -> `<parallelism>` only above one slot.
