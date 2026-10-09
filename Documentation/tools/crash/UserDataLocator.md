# UserDataLocator

`tools/crash/UserDataLocator.js`

The userData folder of the dev app: `LUMA_DATA_DIR` when set (an isolated run), else `%APPDATA%\<name>` (Windows),
`~/Library/Application Support/<name>` (macOS) or `$XDG_CONFIG_HOME/<name>` / `~/.config/<name>`, where `<name>` is
package.json `name` (what Electron uses for `electron .`).

## Methods

- `UserDataLocator.resolve({ env, platform, home, appName })`, `UserDataLocator.isIsolated(env)`.
