# FenceFallbackDoc

`core/llm-server/chat/tool-schemas/FenceFallbackDoc.js`

The text-fence contract for tools a native-tool-calling family keeps out of
the registered array (`modelFamilies` `nativeToolExclude`, e.g. Qwen3.8's
`edit_artifact`, whose native call arrives with empty arguments).

## Methods

- `FenceFallbackDoc.build(names, schemas)`: `null` when `names` is empty.
  Otherwise "NOT a native function on this model: `a`, `b`. Do NOT call it
  through the function-calling channel (its arguments arrive empty there)...",
  one fenced example for the first tool, then `Parameter contract:` with
  `- name: description` and one line per param:
  `"key": type one of "x"|"y" (required) -- description`. A name with no schema
  is listed bare.

## Why

On the native route the manuals lose their fence examples and the schema is
the parameter contract, so a tool removed from the array would be a name with
no shape. This spells the shape out from the same schema.
