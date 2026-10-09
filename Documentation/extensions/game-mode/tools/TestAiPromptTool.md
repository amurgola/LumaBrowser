# TestAiPromptTool

`extensions/game-mode/tools/TestAiPromptTool.js`

`test_ai_prompt` (AI games only, sandboxed): tries a system/prompt/json/tools set against the same [AiBridge](../ai/AiBridge.md) the running game uses, so the agent tunes it before wiring it in. Always `success: true`; the message reports a JSON value, a tool call, text, or the failure with the raw reply.

## Methods

- `new TestAiPromptTool(scope, { bridge, framing })`.
