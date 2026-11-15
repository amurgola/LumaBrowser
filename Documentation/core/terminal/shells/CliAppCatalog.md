# CliAppCatalog

`core/terminal/shells/CliAppCatalog.js`

Command-line apps offered as terminal profiles when their program is on PATH: Claude Code, Codex CLI, Gemini CLI,
opencode, GitHub Copilot CLI, Aider and the Luma agent. Each becomes `{ id: 'app:<id>', label, kind: 'app', command,
source: 'app' }` and runs as the first command of the user's shell.

## Methods

- Static `detect({ env, platform, find })`. Static `APPS`.
