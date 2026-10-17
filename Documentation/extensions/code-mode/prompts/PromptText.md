# PromptText

`extensions/code-mode/prompts/PromptText.js`

The fixed prompt blocks of the Code chat mode (static strings).

## Members

- `EXTENSION_GROUNDING` (`<lumabrowser_extensions>`: anatomy, manifest fields, the context object).
- `VALIDATION_NOTE` (`<validation>`), `BROWSER_API` (`<browser_api>`: the real BrowserService methods, `getTabs()` as `{ success, tabs }`, that `executeJs` rejects a script that does not compile, the rule to write page code as a real function sent as `(fn.toString())(JSON args)` rather than JS inside a template literal, and a working example that logs failed injections through `context.logger.warn`).
- `TOOL_WORKFLOW`, `NO_TOOL_WORKFLOW` (build mode), `PROJECT_WORKFLOW` (project mode).
- `TERMINAL_NOTE` (`<terminal>`), `COMMANDS_NOTE` (`<commands>`).
- `BUILD_IDENTITY`, `PROJECT_IDENTITY` (the opening line of each prompt).

## Why

A tight, curated brief beats loading the extensions guide at runtime: the guide
may not ship in packaged builds, and local models do better with a focused block.
