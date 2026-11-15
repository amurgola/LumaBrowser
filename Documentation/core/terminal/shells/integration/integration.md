# Shell integration scripts

`core/terminal/shells/integration/luma-integration.ps1`, `luma-integration.bash`, `luma-integration.zsh`

What each shell runs at startup so the terminal knows where prompts and commands begin and end. They print the OSC 633
marks [ShellIntegrationParser](../../host/ShellIntegrationParser.md) reads. Each wraps what the user already has (their
prompt, their startup files) instead of replacing it.

- **PowerShell (5.1 and 7).** Wraps the `prompt` function the profile left in place: command end with exit code,
  folder, prompt start and end. A failed command reports the native exit code only when that command changed
  `$LASTEXITCODE`; a failed cmdlet reports 1 instead of some earlier program's stale code. With PSReadLine, the line
  the user accepted marks the command start and carries its text.
- **bash.** Loaded with `--init-file`, so it first reads the files bash would have (`/etc/profile` and the login file
  for login profiles, else `~/.bashrc`). `PROMPT_COMMAND` reports the exit code and the folder (as a Windows path under
  Git Bash) and puts the prompt marks back when a theme rebuilt `PS1`; `PS0` marks the command start (bash 4.4 and
  later).
- **zsh.** Every startup stage hands over to the user's own file of that name with their `ZDOTDIR`, then the `zshrc`
  stage adds `precmd` and `preexec` hooks.

A profile's first command (`LUMA_STARTUP_COMMAND`) runs at the end, after the user's startup files.

Verified live on Windows with PowerShell 7, Windows PowerShell, Command Prompt and Git Bash. The zsh script and bash on
macOS and Linux are covered by unit tests of how they are launched, not yet by a live run.
