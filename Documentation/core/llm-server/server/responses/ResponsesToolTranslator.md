# ResponsesToolTranslator

`core/llm-server/server/responses/ResponsesToolTranslator.js`

Translates Responses tools into chat function tools.

## Methods

- `apply(body, out)` writes `tools`, `tool_choice` and `parallel_tool_calls`
  into `out` (nothing when no tool survives) and returns
  `{ customTools: Set<name>, dropped: [type] }`:
  - `function` tools: `{ type: 'function', function: { name, description, parameters, strict? } }`;
  - `custom` tools (Codex's freeform `apply_patch`): a function taking
    `{ input: string }`, with `CUSTOM_INPUT_HINT` and any grammar definition in
    the description;
  - every other type is dropped and reported;
  - `tool_choice` strings `auto`/`none`/`required` pass, `{ type: function|custom, name }`
    names a function, anything else is ignored.

## Why

Local models only do JSON function calling; wrapping a custom tool's raw text
in one string argument keeps apply_patch usable, and the reply translators turn
it back into a `custom_tool_call`.
