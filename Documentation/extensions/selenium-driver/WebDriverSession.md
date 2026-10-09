# WebDriverSession

`extensions/selenium-driver/WebDriverSession.js`

One WebDriver session. Element handles store how an element was found, never a live
node (executeJavaScript cannot keep one), and are re-queried on every command.

## Members

- Fields: `id`, `tabId`, `capabilities`, `llmFallback` (default `{ enabled: false }`),
  `timeouts` (`script 30000, pageLoad 300000, implicit 0`), `currentFrameChain`,
  `elements`, `shadowRoots`, `createdAt`.
- `ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'`, `SHADOW_KEY = 'shadow-6066-11e4-a52e-4f735466cecf'`.
- `registerElement(entry)` -> `{ [ELEMENT_KEY]: uuid }`; `registerShadow(entry)`;
  `getElement(uuid)`, `getShadow(uuid)` (null when unknown). An element entry is
  `{ using, value, scopeSelector, selector, description? }` where `selector` is
  `ElementScripts.encode(...)`.
