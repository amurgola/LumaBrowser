# LabTextReport

`extensions/roleplay-mode/lab/LabTextReport.js`

Writes a text playthrough as `text-run.json` and `text-run.md` (scores, the
consistency checks as a checklist, the cast and initiative checks with each
pair's overlap and the moved turns, then the transcript with each reply's word
count, slop hits and context size).

## Methods

- `LabTextReport.write(outDir, result)` the directory, or null (never throws).
- `LabTextReport.markdown(result)`; the title names the scenario, and a
  physicality result adds its scores, notes and one `slip:` line each; a reveal
  result adds its scores, the retention per recall turn and a Reveals section
  (each reveal, whether it was still in context at the end, each recall's
  match or drift). Every report adds the body-detail rate, the grounding line
  (cards per turn, and for the control whether anything fired) and, under each
  turn, the cards that turn handed the narrator.
