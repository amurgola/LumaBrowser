# InstalledModelRow

`core/llm-server/ui/js/image-setup/InstalledModelRow.js`

`InstalledModelRow.view(model, defaults, downloading, int8Build?)` builds the mlRow view of an installed image model: category pill ("generation + edit" for unified weights), default badges, file-update pills, NC and imported pills, the faster weights block in `dlHtml` ([Int8WeightsMarkup](Int8WeightsMarkup.md) over `model.int8Weights`, with `int8Build` the live progress of a build this page started), and the actions Pin, Pin as edit default (unified only), Update <file>, Move to <other categories> (never Edit for a unified model), LoRAs / speed and Remove. All interpolated values are escaped.

## Globals

None.

## LoRA trainable badge

An installed model that carries `loraTrainable` shows the badge built by
[CatalogModelRow](CatalogModelRow.md) `trainablePill`.
