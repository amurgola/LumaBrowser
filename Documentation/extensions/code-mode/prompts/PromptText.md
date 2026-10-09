# PromptText

`extensions/code-mode/prompts/PromptText.js`

The fixed prompt blocks of the Code chat mode (static strings).

## Members

- `EXTENSION_GROUNDING` (`<lumabrowser_extensions>`: anatomy, manifest fields, the context object).
- `VALIDATION_NOTE` (`<validation>`), `BROWSER_API` (`<browser_api>`: the real BrowserService methods and a working example).
- `TOOL_WORKFLOW`, `NO_TOOL_WORKFLOW` (build mode), `PROJECT_WORKFLOW` (project mode).
- `TERMINAL_NOTE` (`<terminal>`), `COMMANDS_NOTE` (`<commands>`).
- `BUILD_IDENTITY`, `PROJECT_IDENTITY` (the opening line of each prompt).

## Why

A tight, curated brief beats loading the extensions guide at runtime: the guide
may not ship in packaged builds, and local models do better with a focused block.
