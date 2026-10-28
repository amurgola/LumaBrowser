# RegionPromptHint

`core/image-server/prompt/RegionPromptHint.js`

Words a user-painted region for an instruction edit model that takes no mask:
where the area sits, how much of the picture it is, and that nothing outside it
may change.

## Methods (all static)

- `build({ bounds, width, height, coverage })`: "Apply the change only inside
  the marked area of the image: the upper left part (a box spanning 10% to 40%
  of the width and 10% to 50% of the height, about 12% of the picture). Leave
  everything outside that area exactly as it is: ...". Without bounds the
  place is "the marked area"; without a coverage the share is left out.
- `place(bounds, width, height)`: the third the region's centre falls in
  ("the upper left part", "the centre"), or "most of the image" above
  `WHOLE_SHARE` (60%) of both dimensions.

## Why

Instruction editors respond to a described location ("semantic masking" in
Google's and Qwen's guides) but not reliably to drawn cues, so the hint is
words, and the composite in [RegionComposite](../region/RegionComposite.md)
enforces what the words ask for.
