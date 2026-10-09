# WebDriverCommandTable

`extensions/selenium-driver/WebDriverCommandTable.js`

Builds every command group around one shared toolset and indexes commands by name.

## Methods

- `WebDriverCommandTable.GROUPS`: the twelve [WebDriverCommandGroup](commands/WebDriverCommandGroup.md)
  classes.
- `WebDriverCommandTable.build({ browser, fallback, fallbackDefaults, registry })` ->
  `Map<name, (session, params, req) => value>`. The toolset adds `page`
  ([PageScript](PageScript.md)), `elements` ([ElementEvaluator](ElementEvaluator.md)),
  `finder` ([ElementFinder](ElementFinder.md)) and `screenshots`
  ([ScreenshotReader](ScreenshotReader.md)). A name defined twice throws.
