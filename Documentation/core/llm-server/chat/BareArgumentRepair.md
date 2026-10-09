# BareArgumentRepair

`core/llm-server/chat/BareArgumentRepair.js`

Turns a tool call whose arguments arrived as a bare string into an arguments
object. The field is chosen from the tool's own schema.

## Methods

- `new BareArgumentRepair(schemas)`: `schemas` has `entry(name)` returning
  `{ required, properties }` or `null` (a [ToolRequiredArgs](ToolRequiredArgs.md)).
- `repair(name, params)`:
  - objects pass through untouched; `null` and blank strings become `{}`;
  - an absolute http(s) URL goes to a text `url` property when there is one;
  - otherwise the sole required field takes it, if that field is text;
  - a tool with no required fields takes it in its first text property
    (web_search's `query`);
  - several required fields, a non-text field, or an unknown tool keep the
    string, and the required-arguments check explains what is missing.

## Why

Small models sometimes send `"cats"` instead of `{"query": "cats"}`. The
schema already says which field a lone string can mean, so no table needs to
be kept in step with the tools. Extension and MCP tools get the same repair for
free. Multiple required fields are ambiguous, and a wrong guess would make a
valid-looking call misbehave, so those strings are left alone.
