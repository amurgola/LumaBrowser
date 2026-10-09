# CodeKickoff

`extensions/code-mode/ui/CodeKickoff.js`

The first user turn Code mode sends from the brief.

## Methods

- `CodeKickoff.message(data)`: with `projectPath` ("Code a project"), a task
  brief that starts with project_overview and only touches files when the task
  needs it (questions are answered in chat), or without a task
  `I want to work on the project at <path>. Start with project_overview and ask
  me what to do.`; otherwise ("Vibe") the build-this-extension brief
  (write_extension_file, then install_extension), or without a task
  `Help me build a LumaBrowser extension.` Both fields are trimmed.

## Globals

None.
