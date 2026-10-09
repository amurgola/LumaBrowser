# FallbackConfig

`extensions/selenium-driver/FallbackConfig.js`

Builds a session's LLM fallback config from the `lumabyte:llmFallback` capability.
Strict W3C clients that do not send it get the saved defaults.

## Methods

- `FallbackConfig.normalize(capValue, defaults)`: `true` all on; null/false follow the
  defaults; an object opts in unless a flag is explicitly false (its slot wins);
  anything else all off.
