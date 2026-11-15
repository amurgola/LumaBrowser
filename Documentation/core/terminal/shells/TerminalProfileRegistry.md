# TerminalProfileRegistry

`core/terminal/shells/TerminalProfileRegistry.js`

Every terminal profile the user can open, in this order: the shells found on this computer
([ShellProfiles](ShellProfiles.md)), the CLI apps on PATH ([CliAppCatalog](CliAppCatalog.md)), the ones extensions
contribute ([TerminalProfileContributions](TerminalProfileContributions.md), ids `ext:<extension>:<id>`) and the user's
own (`core.terminal.profiles`, ids `custom:<id>`). This is the extension point for CLI add-ons: a profile is a program
to run in a terminal, and anything listed here shows up wherever terminals are opened.

- The default (`core.terminal.defaultProfile`) is the user's choice while that profile still exists, else the first
  shell.
- `hostShell()` is the shell an app profile's command runs in: the default profile when it is a shell that can run a
  first command and stay open (PowerShell, bash, zsh, fish, cmd), else the first shell that can.
- Shells and apps are detected once per launch; `refresh()` looks again.

## Methods

- `new TerminalProfileRegistry({ db, detectShells, detectApps, contributions })`.
- `list()`, `get(id)`, `defaultProfile()`, `setDefault(id)`, `hostShell()`, `refresh()`.
- Static `normalize(raw, idPrefix, source)`: a profile with `command` is kind `app`, with `file` kind `shell`; null
  when it names nothing to run.
