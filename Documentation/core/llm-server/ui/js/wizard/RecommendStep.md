# RecommendStep

`core/llm-server/ui/js/wizard/RecommendStep.js`

Step 4: asks `recommendModel(answers)`, then shows the pick (label, quant, size, context, runtime, rationale, hardware, CPU-only or spill warning), the HF search and URL paste, models already on disk, the storage line and "Download & set up".

## Methods

- `RecommendStep.render(wizard, body)`; `RecommendStep.html(rec, hw)`.

## Globals

None.

## Notes

Bug fixed: the hardware line was escaped twice, so a GPU name with "&" showed "&amp;amp;" (test "the recommendation shows the pick, the hardware once escaped").
