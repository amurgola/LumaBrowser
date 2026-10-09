# ExistingImagePlan

`core/llm-server/ui/js/setup/ExistingImagePlan.js`

Lets an Automatic Setup plan link an image checkpoint the user already has
(ComfyUI, Forge, ...) instead of downloading the catalog model. The planner
stays the authority on whether the machine gets images.

## Methods

- `ExistingImagePlan.choices(scan, plan)`: found checkpoints with a path that
  are no larger than the image bytes the plan budgeted (any size in a
  singularity, where the image model has the card to itself). The budget is the
  planned size even after a swap zeroed `approxTotalBytes`.
- `ExistingImagePlan.withExisting(plan, found)`: a copy of `plan` whose image leg
  carries `found`, `label: found.name`, `planned: { label, approxTotalBytes }`
  and `approxTotalBytes: 0`, with its "Image model:" summary line replaced (or
  appended) by "Image model: pony (SDXL), linked from Forge. No download.".
  Pure: pass the planner's original each time; going back is using the original.

## Globals

None.
