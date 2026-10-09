# WebDriverCommandGroup

`extensions/selenium-driver/commands/WebDriverCommandGroup.js`

Base class for a group of WebDriver commands.

## Methods

- `new WebDriverCommandGroup(tools)` with tools `{ browser, fallback, fallbackDefaults, registry, page, elements, finder, screenshots }`;
  subclasses read `_tools`, `_browser`, `_page`, `_elements`.
- `commandNames()`: the method names the group serves; the base throws.
- `WebDriverCommandGroup._body(req)`: the request body or `{}`.

Implementations: SessionCommands, NavigationCommands, WindowCommands, FindCommands, ElementStateCommands, ElementInteractionCommands, ScriptCommands, CookieCommands, CaptureCommands, AlertCommands, ActionCommands, LumabyteCommands.
