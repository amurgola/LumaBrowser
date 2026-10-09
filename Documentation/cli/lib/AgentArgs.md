# AgentArgs

`cli/lib/AgentArgs.js`

Parses `luma` arguments.

## Methods (static)

- `AgentArgs.parse(argv, { readFile?, platform? })` returns
  `{ agent, prompt[], print, json, resume, yes, cwd, showReasoning, noStart, agents, help, plain, noSuggest }`.
  The first non-flag word is `agent` (a name, `.` for the plain Code agent, or `docs` / `skill`);
  later words are prompt words. Flags: `-p/--print`, `--json`, `-y/--yes`, `--resume <id>`,
  `--cwd <dir>`, `--container <name[:/dir]>`, `--prompt-file <file>` (its contents become a prompt
  part), `--show-reasoning`, `--no-start`, `--plain`, `--no-suggest`, `--agents`, `-h/--help`.
  An unknown flag before the agent word throws `unknown flag: <flag>`; after it, it is a prompt word.
- `AgentArgs.containerCwd(spec, platform?)`: `name[:/dir]` as the host path the app reads as "inside
  that container" ([ContainerPath](../../core/shell/ContainerPath.md)): `//docker/<name><dir>` on
  Windows, `/.luma-docker/<name><dir>` elsewhere; `dir` defaults to `/`. Throws
  `--container expects <name> or <name>:/absolute/dir` for a missing name or a relative dir.
- `AgentArgs.defaults()`.
