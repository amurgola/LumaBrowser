# ToolDraftInput

`extensions/tool-forge/ToolDraftInput.js`

The create_tool gates, in order: valid name, no collision, description of at
least 8 characters, object `inputSchema`, non-empty code, no validator errors,
code mentions `run`.

## Methods

- `new ToolDraftInput({ validator, names })` (`validator`: CodeValidator,
  `names`: [ToolNames](ToolNames.md)).
- `check(input)`: `{ error: { success: false, error, diagnostics? } }` for the
  first failed gate, else `{ fields: { name, label, description, inputSchema,
  configSlots, allowedHosts, code } }`. Validator errors return up to 10
  diagnostics; a crashing validator counts as a pass (the sandbox catches real
  problems). The `run` check is a light nudge; the sandbox enforces the
  contract at test time.
- `ToolDraftInput.normalizeSlots(slots)`: keeps slots with a key, as
  `{ key, label (default key), description, required, secret }`.
