# JetBrainsPluginBuilder

`tools/ide/JetBrainsPluginBuilder.js`

Builds `ide/jetbrains` into `ide/dist/luma-jetbrains`: writes the page into `src/main/resources/webview`, picks a
JDK and an installed IDE (`LUMA_IDE_HOME` wins; no SDK download), runs `gradlew buildPlugin
-PpluginVersion=<app version>`, unpacks the zip and writes `jetbrains.json`. Without Java it logs and exits 0
unless `--require`. Thin entry: `scripts/build-jetbrains-plugin.js` (`npm run build:jetbrains`).

## Methods

- `new JetBrainsPluginBuilder(root, { env, platform, log, error })`; `execute(args)` (exit code; flags `--force`, `--skip`, `--require`), `syncPage()`.
