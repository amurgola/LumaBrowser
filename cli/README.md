# LumaBrowser

> A multi-tab browser with built-in AI automation, web notification interception, and a plugin architecture. Controllable locally or remotely via REST API and MCP (Model Context Protocol).

## Install & Run

```bash
npx lumabrowser start
```

That's it. The first run downloads the right build for your OS from [lumabyte.com](https://lumabyte.com), caches it under `~/.lumabrowser/`, and launches it.

Subsequent runs launch from cache, with no re-download unless you ask for one.

## Commands

| Command | What it does |
|---|---|
| `npx lumabrowser start` | Launch LumaBrowser (installs on first run). |
| `npx lumabrowser update` | Force re-download of the latest release. |
| `npx lumabrowser version` | Print the installed LumaBrowser version. |
| `npx lumabrowser uninstall` | Remove the cached installation. |
| `npx lumabrowser help` | Show all commands. |
| `npx lumabrowser agent <name>` | Talk to one of your agents from the terminal (see below). |

## Agents in your terminal: `luma`

The Windows installer puts `luma` on your PATH. On a portable build, an AppImage, or a Mac, turn it on in LumaBrowser under Settings → General → Terminal; that writes a small launcher that runs the bundled CLI with LumaBrowser's own binary, so Node is not required. Installing this npm package globally is the other route, and the one to use when you want the CLI to move independently of app releases.

Once LumaBrowser is running (or installed, so `luma` can start it for you), any agent you created in Setup → Agents can work in the folder you are standing in. The agent runs inside LumaBrowser with its own model, tools, and knowledge base; the terminal shows the stream.

The plain Code agent has the file tools only. To give a session more, create an agent in Setup → Agents and tick the tools it may use; those join the file tools when you run `luma <agent>`. An agent with Generate image can make sprites or icons and drop them into the folder with `save_artifact` (an artifact is either an image or a text artifact such as html, svg or markdown; it stays in the chat until saved).

```bash
luma                                # interactive Code session in the current directory
luma "fix the failing test"          # start with an instruction (first word not an agent = prompt)
luma reviewer                       # interactive session as a named agent
luma reviewer "fix the failing test" # one instruction, then keep chatting
luma . "explain this repo"          # the plain Code agent, no persona
luma reviewer -p "summarize TODOs"   # print mode: answer on stdout, then exit
luma reviewer --json "list files"    # one JSON frame per line, for scripts
luma --agents                        # list agents and their models
```

Flags: `--resume <id>` continue a conversation (they also appear in LumaBrowser's chat sidebar), `--yes` skip approval prompts for this run, `--cwd <dir>`, `--show-reasoning`, `--no-suggest` (skip the model-written follow-up after each turn), `--plain` (line-by-line output instead of the full-screen session), `--no-start`.

### The session

On a real terminal `luma` runs a full-screen session styled like the desktop chat: what you typed sits behind an orange bar, the answer streams in as rendered markdown, each tool the agent runs is one row (`✓ Read src/a.js · 120 lines`, `$ npm test` with its output underneath, `← Edit src/a.js` with a compact diff), and a summary line closes the turn (`▣ done · 5 steps · 4.1k tokens · 7.5s`). Finished turns scroll into the terminal's own scrollback; only the part still changing is repainted.

Before the agent edits a file or runs a command it asks inline:

```
┃ △ Approval needed  Edit src/math.js (1 replacement)
┃   ❯ Allow once     Allow for this run     Deny
┃   ←→ choose · enter confirms · y / a / n · esc denies
```

After each turn the model proposes the next instruction; it appears dimmed in the message box and `tab` (or `→`) types it out so `enter` sends it. Anything you type replaces it.

Keys: `enter` sends, `tab` takes the suggested follow-up, `ctrl+j` (or `alt+enter`) adds a line, `ctrl+o` shows or hides the model's thinking (while it streams, the last three lines scroll in a small box above the status line), `esc` stops the current turn, `ctrl+c` clears the input (twice quits), `ctrl+d` quits when the input is empty, typing `/` lists the commands under the prompt (enter runs the highlighted one, `tab` fills it in, up/down move; after `/agent ` the list is your agents), `up`/`down` walk your previous prompts, `ctrl+l` clears the screen. Typing while a turn is running queues the text as the next prompt.

Commands: `/help`, `/agents`, `/agent <name>` (switch agent, new conversation), `/new`, `/resume <id>`, `/reasoning` (show or hide the model's thinking), `/yes` (toggle approvals for this run), `/id`, `/clear`, `/quit`.

Environment: `NO_COLOR` turns colour off, `LUMA_CLI_THEME=light|dark` overrides the background detection (the session asks the terminal for its background colour and picks a light or dark palette), `LUMA_CLI_ASCII=1` swaps box-drawing glyphs for ASCII.

Exit codes: 0 done, 1 error, 2 stopped, 3 LumaBrowser unreachable.

## Global install

If you'd rather not type `npx` every time:

```bash
npm install -g lumabrowser
lumabrowser start
```

## Platform support

| OS | Asset type |
|---|---|
| Windows (x64) | Portable `.exe` |
| macOS (Intel / Apple Silicon) | `.app` bundle extracted from `.zip` |
| Linux (x64) | `.AppImage` |

## What you get

- **Multi-tab Electron browser** with system tray integration.
- **REST API** (`http://localhost:3000`) for programmatic control.
- **MCP server** so Claude Desktop and other AI tools can drive the browser.
- **Web notification interception**: any page's `Notification(...)` calls get forwarded to a webhook.
- **Network watcher**: URL patterns trigger webhooks when matching responses fire.
- **AI chat sidebar** that can navigate, click, fill forms, and take screenshots.
- **Local LLMs** via the bundled llama.cpp server (GGUF models) for private inference, with no API keys required.
- **Extension system** with runtime enable/disable and zip-based installation.

## Learn more

- Docs & downloads: [lumabyte.com](https://lumabyte.com)
- API docs: [lumabyte.com/apis](https://lumabyte.com/apis)
- Report issues: [github.com/amurgola/LumaBrowser/issues](https://github.com/amurgola/LumaBrowser/issues)

## Advanced: custom manifest

By default the launcher reads `https://lumabyte.com/install/manifest.json`. To point at a staging or self-hosted mirror, set `LUMABROWSER_MANIFEST_URL`:

```bash
LUMABROWSER_MANIFEST_URL=https://staging.lumabyte.com/install/manifest.json npx lumabrowser start
```

## License

GNU Affero General Public License v3.0 or later; see [LICENSE](./LICENSE). A commercial
license is available from Lumabyte, LLC for organizations that want to keep their
modifications private; see https://github.com/amurgola/LumaBrowser/blob/main/COMMERCIAL-LICENSE.md or https://lumabyte.com.
