# ToolEditView

`extensions/tool-forge/ui/ToolEditView.js`

## Methods

- `ToolEditView.render(el, { tool, slots, canPublish, notice }, on)`: back
  link "<- My Tools" and the status, the notice, the Settings form (one input
  per config slot: password for secrets, placeholder "(set)" or "Not set",
  "Save settings"), the Code section with the `[data-tf-editor]` host, the
  collapsible Definition (label, description, allowed hosts, the
  [ToolSlotEditor](ToolSlotEditor.md), input schema JSON) and the action bar
  (test args, Test, Save draft, Publish disabled with a tooltip until a test passes).
- `ToolEditView.collectPatch(el, slots, code)`: `{ label, description,
  allowedHosts (comma split, trimmed, blanks dropped), inputSchema (empty =
  object schema), configSlots, code }`; throws "Input schema is not valid JSON: ...".
- `ToolEditView.collectSettings(el)`: the filled slot inputs only.
