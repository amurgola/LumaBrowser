# ImageStep

`core/shell/ui/wizard/steps/ImageStep.js` (ES module)

The optional Image Gen step, one title ("Add local image generation?") for every view.

## Methods

- `render()`: dispatches `image.view` to [ImageAskPane](../image/ImageAskPane.md),
  [ImageRecommendPane](../image/ImageRecommendPane.md) or
  [ImageStatusPanes](../image/ImageStatusPanes.md).
- `pane()` (`#setupImagePane`); `runner` ([ImageRunner](../image/ImageRunner.md)).

## Globals

None.
