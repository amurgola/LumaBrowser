# CallDescriber

`core/llm-server/chat/approval/CallDescriber.js`

Writes the one sentence an approval card shows for a tool call.

## Methods (all static)

- `describe(toolName, params, assessment?)`: for a command tool with a
  [CommandCallAssessor](CommandCallAssessor.md) assessment, the assessment's
  `detail` (which names a mass-destructive reason and outside write targets).
  Otherwise one sentence per gated tool, for example
  `Overwrite src/a.js with 4 characters`, `Edit src/a.js (2 replacements)`,
  ``Run `npm test` in sub``, `Send a webhook to <url>`,
  `Create the scheduled task "<title>" (every N min)`. Unknown tools (including
  prototype keys such as `constructor`) give `Run <name>`. Missing parameters
  degrade to readable text (`Overwrite  with 0 characters`, `this build`,
  `untitled`). Values are clipped with [CardText](CardText.md).

## Why

Written from the user's side: what will change, not which function runs.
Someone approving a write needs the path and the scale of it, and the model's
own description of a webhook is not evidence about where it goes.
