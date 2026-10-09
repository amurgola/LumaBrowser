# LumaHome

`cli/lib/connect/LumaHome.js`

The CLI's own folder, `~/.lumabrowser`: the app's handshake (`cli.json`), the launcher's install
record (`install.json`), the trace pointer (`traces.json`) and downloaded installers.

## Methods (static)

- `LumaHome.dir()`: `<home>/.lumabrowser`, read from `os.homedir()` on every call.
- `LumaHome.file(name)`: a file inside it.
- `LumaHome.DIR_NAME`: `.lumabrowser`.
