# Int8WeightsMarkup

`core/llm-server/ui/js/image-setup/Int8WeightsMarkup.js`

The faster weights block of an installed image model row (its `dlHtml`, inside the expanded details), built by
[InstalledModelRow](InstalledModelRow.md) from the models view's `int8Weights`
([Int8WeightsBuilder](../../../../image-server/ipc/Int8WeightsBuilder.md) `describe`).

## Methods

- `Int8WeightsMarkup.html(id, int8, building)`, in order of precedence:
  - building (the live `building` progress, else the view's `int8.building`): "Building faster weights", the
    progress bar, "N% · done of total" ("starting…" before the first tick) and a Stop button (`int8-cancel`);
  - present: the quiet line "Faster weights (INT8) in use · <size>" (title: used when the image runtime is a CUDA
    build) and a Remove button (`int8-remove`);
  - buildable: a "Build faster weights" button (`int8-build`) and the caption;
  - otherwise `''`, so a model without a recipe shows nothing.
- `Int8WeightsMarkup.caption(estimatedBytes)` "INT8 copy of the weights, about 1.6 times faster on NVIDIA cards,
  <size> more disk", without the size note when the source size is unknown.
- Statics: `CAPTION`.

Buttons carry `data-ml-act` and `data-id`; [ImageModelActions](ImageModelActions.md) routes them. Sizes use
`ByteFormatter` (binary units, so Anima's 2.34 GB copy reads "2.2 GB").

## Globals

None.
