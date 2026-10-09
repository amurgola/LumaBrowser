# ToolRequiredArgs

`core/llm-server/chat/ToolRequiredArgs.js`

Enforces each tool's `required` arguments at the chat agent's dispatch point.
One instance indexes the tools of one agent run.

## Methods

- `new ToolRequiredArgs(extTools = [])` indexes, in order: the chat
  pseudo-tools and `activate_tools` (from [ToolSchemas](ToolSchemas.md), built
  once per process), the browser tools with a `required` list (from
  `BrowserTools.TOOL_DEFINITIONS`), then `extTools` (discovered extension and
  MCP tools plus mode-injected tools, each with a JSON-schema `inputSchema`).
  A later entry with the same name replaces an earlier one; tools without
  required fields are not indexed.
- `entry(name)` returns `{ required, properties }` or `null`.
- `missing(name, params)` returns the hard-missing fields; empty means the
  call may run. A field counts as present under its canonical key or any alias;
  `null`, blank strings and empty arrays count as absent. Non-object or array
  `params` count as no arguments.
- `softMissing(name, params)` returns the soft-required fields the call lacks.
- `refusal(name, params)` returns `null`, or
  `{ success: false, error, missingArgs }` to hand back to the model.
- `withSoftMissingNote(result, name, params)` appends a
  `Note: this <tool> call omitted "<field>" (<meaning>); a default was used. ...`
  to `result.message` (or `result.error`, or sets `message`). Mutates and returns
  `result`; a non-object is returned untouched.
- `missingArgumentsMessage(name, missing, params)` is the refusal text: each
  missing field with its meaning (browser-tool type string, or JSON-schema type,
  enum values and description), the keys that did arrive, and "Re-issue the call
  ...". A call with no arguments at all also gets the text-fence hint.
- Statics: `GLOBAL_ALIASES` (`artifactId` also as `artifact_id`, `id`,
  `imageId`), `TOOL_ALIASES` (`create_live_artifact.html` as `js` / `content`,
  `activate_tools.groups` as `group` / `tools`, `collect_list.itemSelector` as
  `baseSelector`), `SOFT_REQUIRED` (`create_artifact.type`).

## Why

`inputSchema.required` binds only a provider that validates against it. A local
model's ```` ```tool ```` fence, or a llama.cpp native call whose arguments the
token cap healed to `{}`, reached handlers unchecked; handlers then did
something plausible with nothing (grep matched the whole repo, find listed
every file, create_artifact made a blank artifact and reported success). A tool
that names the missing field is better than one that succeeds at the wrong
thing, because the model reasons from the result. This class is the one place
that knowledge lives, so `required` means required on both transports.

Aliases mirror what the handlers already accept, so refusing `{ id: "art_1" }`
would be a regression. Soft-required fields have a real default in the handler:
bouncing a call that carries a whole generated document to ask for one enum
value cost an artifacts task its entire budget. When every required field is
absent the soft ones turn hard, so `create_artifact {}` is refused rather than
making a blank artifact.

The text-fence hint exists because an empty native call is usually a model that
wrote the arguments and lost them in the native channel (Qwen3.8 sent an empty
`edit_artifact` six times running). Re-issuing natively reproduces the loss;
the fence is the path every observed recovery took.
