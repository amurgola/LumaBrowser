# DefaultBrowser

`core/shell/default-browser/DefaultBrowser.js`

"Make LumaBrowser the default browser". No platform lets an app silently take the default, so this registers
LumaBrowser as a browser and hands the final choice to the OS:

- **Windows:** per-user registry entries, with no admin needed and the same for installed and portable copies:
  - `HKCU\Software\Classes\LumaBrowserHTML` (open command, icon);
  - `HKCU\Software\Clients\StartMenuInternet\LumaBrowser` with Capabilities: URLAssociations http/https and
    FileAssociations .htm .html .xhtml .shtml .svg;
  - `HKCU\Software\RegisteredApplications\LumaBrowser`.

  Then it opens `ms-settings:defaultapps?registeredAppUser=LumaBrowser`, where the user picks. The open command uses
  `PORTABLE_EXECUTABLE_FILE` for a portable copy (its own file, not the temp unpack folder), and for a development run
  it adds the app folder after electron.exe.
- **macOS:** `app.setAsDefaultProtocolClient('http' / 'https')`, which asks the user. package.json `build.protocols`
  declares the URL types.
- **Linux:** `xdg-settings set default-web-browser lumabrowser.desktop`.

`status()` -> `{ supported, isDefault, platform }`. On Windows it reads the https UserChoice ProgId.

## Methods

- `new DefaultBrowser({ app, shell, run, env, platform, execPath, appPath, isPackaged })` (`run(file, args)` ->
  `Promise<{ stdout }>`).
- `status()`, `makeDefault()` -> `{ success, opened: 'settings' | 'prompt' | 'set' }`, `launchCommand()`,
  `registryEntries()`, `registerWindows()`, `unregisterWindows()`.
