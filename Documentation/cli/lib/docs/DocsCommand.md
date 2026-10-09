# DocsCommand

`cli/lib/docs/DocsCommand.js`

`luma docs [topic]`: product documentation written for language models working through a terminal.
The topics are the Markdown files beside this class (`local-api.md`, `api.md`, `tools.md`,
`remote-access.md`) and print with no app, no network and no state.

## Methods (static)

- `DocsCommand.run(args, { stdout?, stderr? })`: no topic prints `directoryText()` (exit 0); a known
  topic prints its exact Markdown (exit 0); an unknown one prints
  `luma docs: no topic "<id>". Topics: ...` to stderr (exit 1).
- `DocsCommand.readTopic(id)`: the Markdown with exactly one trailing newline, or `null`.
- `DocsCommand.directoryText()`, `listTopics()`, `findTopic(id)`.
- `DocsCommand.TOPICS` (`{ id, description, file }`), `DocsCommand.DOCS_DIR`.
