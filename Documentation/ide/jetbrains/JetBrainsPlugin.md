# JetBrains plugin

`ide/jetbrains/` (Kotlin, Gradle 9.2.1, Kotlin 2.4.20, IntelliJ Platform Gradle Plugin 2.18.1, sinceBuild 243, JVM 21)

A thin Kotlin shell around the app's terminal bridge
([TerminalBridge](../../extensions/code-mode/terminal/TerminalBridge.md)): the IDE side owns the socket, the editor,
files and notifications; a JCEF page renders the conversation. The page is the shared
[ide/webview](../webview/ui/LumaPage.md), written into `src/main/resources/webview` at build time by
[JetBrainsPluginBuilder](../../tools/ide/JetBrainsPluginBuilder.md); `LumaWebView.kt` inlines `luma.css`,
`shared/tool-grammar.js` and the bundled `app.js` into `index.html`'s placeholders and loads it from a string.
The wire protocol (hello with `origin: 'ide'`, prompt with context, commit-message, frames) is identical to the
VS Code extension's [LumaSession](../vscode/src/LumaSession.md).

## Packages

| Package | Classes |
|---|---|
| `bridge` | `Handshake` (cli.json), `AppLauncher`, `BridgeClient` (JDK WebSocket, HTTP/1.1), `LumaSession` |
| `ui` | `LumaToolWindowFactory`, `LumaWebView` (JCEF host, cursor mapping), `LumaDevStartup` (LUMA_DEV_* hooks) |
| `ide` | `EditorContext`, `FileSync`, `LumaNotifications`, `LumaStatusBarWidgetFactory` |
| `actions` | `Actions.kt` (editor, project view and tool window actions) |
| `vcs` | `GenerateCommitMessageAction`, `CommitDiff` (optional `luma-vcs.xml`) |
| `settings` | `LumaSettings`, `LumaConfigurable` |
| `theme` | `IdeTheme` (--ide-* tokens) |

## Build

`npm run build:jetbrains` (needs a JDK: JAVA_HOME or an installed IDE's `jbr`). Output `ide/dist/luma-jetbrains` plus `jetbrains.json`; `build/`, `.gradle/`, `.intellijPlatform/`, `.kotlin/` and `src/main/resources/webview` are build output.
