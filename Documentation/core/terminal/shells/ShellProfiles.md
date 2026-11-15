# ShellProfiles

`core/terminal/shells/ShellProfiles.js`

Finds the shells installed on this computer and describes each as a profile `{ id, label, kind: 'shell', family, file,
args, login, source: 'system' }`. The first one is the default.

- **Windows:** PowerShell 7 (`pwsh`: on PATH, in its installer folder, or the launcher a Microsoft Store install
  leaves in `WindowsApps`, which ordinary existence checks cannot open), Windows PowerShell, Command Prompt, Git Bash
  and WSL.
- **macOS and Linux:** the login shell, then what `/etc/shells` lists, each once; `/bin/sh` when nothing is readable.
  macOS shells are started as login shells, which is where PATH additions are set up.

The family (`powershell`, `cmd`, `bash`, `zsh`, `fish`, `wsl`, `other`) decides how
[ShellLaunch](ShellLaunch.md) starts the shell.

## Methods

- Static `detect({ platform, env, exists, readFile, find, aliasExists })`.
