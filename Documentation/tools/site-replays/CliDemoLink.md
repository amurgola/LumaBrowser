# CliDemoLink

`tools/site-replays/CliDemoLink.js`

A [FakeBridgeLink](FakeBridgeLink.md) with canned answers for the `luma` session demo ([CliTuiDemo](CliTuiDemo.md)):
two agents (`reviewer`, `writer`) and one scripted turn per prompt: streamed reasoning long enough to scroll the
preview box, `read_file` and `grep` calls, a tool fence the host rolls back, an `edit_file` approval, then either the
rejection answer or the edit, `npm test` output, a markdown answer with a table, `done` and a suggestion.

## Methods

- `new CliDemoLink({ autoApprove = false })`: `autoApprove` answers the approval `once` after 1.2 s.
- `send(type, payload)`: `hello`, `list-agents`, `approve` (records `decision`), `abort` (an abort during the tool
  calls ends the turn as aborted), `prompt` (plays the turn).
- State: `turns`, `aborted`, `decision`. Constants: `MODEL`, `EDIT`, `TOOL_FENCE`, `THOUGHTS`, `TEST_OUTPUT`, `ANSWER`.
