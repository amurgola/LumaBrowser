# SessionCapabilities

`extensions/selenium-driver/SessionCapabilities.js`

## Methods

- `SessionCapabilities.merge(capabilities)`: the first `firstMatch` arm with no key
  in `alwaysMatch`, merged over it; just `alwaysMatch` when every arm clashes.
- `SessionCapabilities.returned(merged, llmFallback)`: `browserName 'chrome'`,
  `browserVersion '1.0.0-lumabrowser'`, `platformName`, `acceptInsecureCerts`,
  `pageLoadStrategy` (default normal), `setWindowRect: false`,
  `strictFileInteractability: false`, default timeouts, `unhandledPromptBehavior`
  (default `dismiss and notify`), `goog:chromeOptions` passed through,
  `lumabyte:llmFallback`, and `lumabyte:features { cdpPassthrough, aiDescriptionLocator, domSnapshot }`.
- `SessionCapabilities.platformName(platform = process.platform)`: windows, mac or linux.
