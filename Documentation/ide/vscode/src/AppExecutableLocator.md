# AppExecutableLocator

`ide/vscode/src/AppExecutableLocator.js`

Where LumaBrowser is installed: the setting, `LUMA_APP_EXE`, the standard locations, then `~/.lumabrowser/install.json`. Never the running process.

## Methods

- `AppExecutableLocator.resolveExecutable({ fromSettings, platform, env, home, exists, readFile })`.
- `AppExecutableLocator.defaultCandidates({ platform, env, home })`.
