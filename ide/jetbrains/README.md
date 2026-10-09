# LumaBrowser for JetBrains IDEs

<!-- Plugin description -->
<p>The LumaBrowser Code agent inside WebStorm, IntelliJ IDEA, PyCharm, GoLand, PhpStorm, Rider, CLion and the other JetBrains IDEs.</p>
<p>Open the <b>Luma</b> tool window and the agent works on the project you have open, with the local models, tools and agents you set up in LumaBrowser. Ask about the selection, add files to the chat, let it read, search, edit and run commands with your approval, and review each edit in the IDE's own diff viewer. In the commit dialog, <b>Generate Commit Message with Luma</b> drafts a concise message from the changes you ticked. Every session is a Code conversation in LumaBrowser too, so you can pick it up in the app or from the <code>luma</code> terminal command.</p>
<p>Requires LumaBrowser on the same machine (the plugin starts it when it is not running).</p>
<!-- Plugin description end -->

## How it fits

The plugin is a thin shell. LumaBrowser does the work: model loading and hotswap, tool execution, file safety, approvals, compaction, history. The IDE side owns the socket, the editor, files and notifications, and a JCEF page renders the conversation with the same markdown renderer and tool-row grammar the desktop chat and the `luma` terminal use.

```
IDE  ──WebSocket──▶  LumaBrowser  /api/ext/code-mode/terminal   (extensions/code-mode/terminal/TerminalBridge.js)
 │ hello { cwd: <project>, origin: 'ide', client: 'jetbrains/WebStorm 2026.2' }
 │ prompt { text, context: [{ path, startLine, endLine, text }] }
 │ commit-message { requestId, diff, files, hint }        (the commit dialog; a side completion, never a message)
 ◀ delta / reasoning-delta / status / tool / command:output / done / error / suggest / commit-message-result …
```

Discovery is the handshake file the app writes on every boot (`~/.lumabrowser/cli.json`: port + per-launch token), the same one the CLI reads.

## Layout

| Path | What |
|---|---|
| `src/main/kotlin/com/lumabyte/luma/bridge` | handshake file, app launcher, the WebSocket client, the per-project session |
| `src/main/kotlin/com/lumabyte/luma/ui` | tool window, the JCEF page host, the offline panel |
| `src/main/kotlin/com/lumabyte/luma/ide` | editor context, file refresh + diff, notifications, status bar |
| `src/main/kotlin/com/lumabyte/luma/actions` | editor / project-view / tool-window actions |
| `src/main/kotlin/com/lumabyte/luma/vcs` | the commit dialog's Generate Commit Message button: the ticked changes as a unified diff (IDE change model + platform line diff, every VCS) → `commit-message` frame → the message box |
| `src/main/kotlin/com/lumabyte/luma/settings` | Settings → Tools → LumaBrowser |
| `src/main/resources/webview` | generated at build time, gitignored: the page (`index.html`, `luma.css`) is copied from `ide/webview`, which the VS Code extension (`ide/vscode`) renders too; `app.js` is `ide/webview/ui` bundled with the app's markdown modules; `shared/tool-grammar.js` is the CLI's tool grammar. Edit `ide/webview`, never these copies |

## Building

From the app repo root:

```
npm run build:jetbrains
```

`scripts/build-jetbrains-plugin.js` (`tools/ide/JetBrainsPluginBuilder.js`) writes the page from `ide/webview` (its modules bundled into `app.js`) and the shared tool grammar, picks a JDK (JAVA_HOME, else a JetBrains Runtime from an installed IDE), builds against an installed IDE when it finds one (`LUMA_IDE_HOME`, no SDK download), and unpacks the result to `ide/dist/luma-jetbrains` with a `jetbrains.json` sidecar. electron-builder ships that folder as `resources/ide`, the Windows installer offers to copy it into every JetBrains IDE it finds, and Settings → General → JetBrains IDEs does the same at runtime on every platform.

To run a sandboxed IDE with the plugin: `./gradlew runIde` in this folder (set `LUMA_IDE_HOME` to reuse an installed IDE). Dev hooks for scripted runs: `LUMA_RUN_PROJECT=<folder>` opens that project, `LUMA_DEV_OPEN=1` opens the tool window on start, `LUMA_DEV_PROMPT=<text>` sends a prompt once connected, `LUMA_DEV_APPROVE=once|run|reject` (and `LUMA_DEV_APPROVE_DELAY_MS`) answers approvals. `tests/ide/webview/IdePage.test.js` renders the page alone in jsdom with a scripted turn.

## Shortcuts

| Keys | Action |
|---|---|
| Ctrl+Shift+L | Ask Luma about the selection (or the current file) |
| Ctrl+Shift+Alt+L | Add the selection to the chat without sending |
| Escape (in the tool window) | Stop the running turn |
