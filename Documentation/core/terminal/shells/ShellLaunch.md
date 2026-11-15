# ShellLaunch

`core/terminal/shells/ShellLaunch.js`

Turns a shell profile into what to start: program, arguments, environment and folder. This is where the differences
between shells are absorbed.

| Family | Integration | A first command (a CLI app) |
|---|---|---|
| PowerShell | the script as `-EncodedCommand` with `-NoExit` (no execution policy applies; the profile still loads) | appended to the script |
| Command Prompt | `PROMPT` marks the prompt and reports the folder; no exit codes | `/K command` |
| bash | `--init-file`; login profiles set `LUMA_BASH_LOGIN` and `CHERE_INVOKING` | `LUMA_STARTUP_COMMAND` |
| zsh | `ZDOTDIR` points at our startup folder, `LUMA_USER_ZDOTDIR` at the user's | `LUMA_STARTUP_COMMAND` |
| fish | none needed (fish marks its own prompt) | `-C command` |
| other, WSL | none | `-c command` (the terminal ends with it) |

The environment is the app's own without its `ELECTRON_*` switches, then the profile's, an app profile's, the
integration's and the session's, plus `TERM_PROGRAM=LumaBrowser`, `TERM_PROGRAM_VERSION`, `COLORTERM=truecolor` and `COLORFGBG=15;0` (light on
dark, which is how the luma CLI and others pick their dark theme). A
folder that does not exist (a restored tab, a model's guess) falls back to the home folder.

## Methods

- `new ShellLaunch({ files, baseEnv, appVersion, isDirectory, homeDir })`.
- `build(shell, { cwd, startupCommand, sessionEnv, extraEnv, profileId, label })` -> `{ file, args, cwd, env,
  profileId, label }`.

The inherited environment first goes through `InheritedDebugEnv.forUserShell`, so an IDE debugger the app was started under does not follow into the user's shell.
