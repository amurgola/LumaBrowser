# LabTextReport

`extensions/roleplay-mode/lab/LabTextReport.js`

Writes a text playthrough as `text-run.json` and `text-run.md` (scores, the
consistency checks as a checklist, then the transcript with each reply's word
count, slop hits and context size).

## Methods

- `LabTextReport.write(outDir, result)` the directory, or null (never throws).
- `LabTextReport.markdown(result)`.
