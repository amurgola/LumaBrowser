# LabTextReport

`extensions/roleplay-mode/lab/LabTextReport.js`

Writes a text playthrough as `text-run.json` and `text-run.md` (scores, the
consistency checks as a checklist, the cast and initiative checks with each
pair's overlap and the moved turns, then the transcript with each reply's word
count, slop hits and context size).

## Methods

- `LabTextReport.write(outDir, result)` the directory, or null (never throws).
- `LabTextReport.markdown(result)`.
