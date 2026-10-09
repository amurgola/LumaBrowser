# LumabyteCommands

`extensions/selenium-driver/commands/LumabyteCommands.js`

The `lumabyte:` vendor commands.

A [WebDriverCommandGroup](WebDriverCommandGroup.md). Every command takes
`(session, params, req)` and returns the `value` of the W3C envelope.

## Commands

- `lumabyteFind({ description, action?, hintSelector? })` and `lumabyteClick`
  need a description (`invalid argument`) and an opted-in session
  (`unsupported operation` `lumabyte:llmFallback.enabled=false`).
- `lumabyteFind` resolves through the fallback; zero matches is `no such element`;
  the handle remembers the description (used by the click retry).
- `lumabyteClick({ description, selector?, text? })`: a given selector is clicked
  directly first (`resolvedVia: 'selector'`), else the description is resolved and
  clicked (`'description'`) -> `{ ok, url, resolvedSelector, resolvedVia }`.
- `lumabyteDomSnapshot({ sourceType = 'structured', includeScreenshot })` ->
  `{ url, title, source, screenshot? }` (a failed screenshot is null).
- `lumabyteCdpExecute({ cmd, params })` and its alias `googCdpExecute` (ChromeDriver's
  `execute_cdp_cmd`): sends the command on the tab's `webContents.debugger` (attaching
  1.3 if needed) -> `{ result }`; failure is `javascript error`.
