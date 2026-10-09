# SliderSetter

`core/browser/widgets/SliderSetter.js`

`set_slider` end to end, behind [WidgetDriver](WidgetDriver.md)`.setSlider`.

## Methods

- `new SliderSetter(wc).execute({ ref?, selector?, value })`. `value` must be a number.
  - `<input type=range>`: snapped with [SliderValue](SliderValue.md), set with the native setter and read
    back: `{ kind: 'range', value, requested, min, max, verified, note? }` (note says it snapped).
  - ARIA slider: clamped to its range; already there is `method: 'none'`. Otherwise
    [SliderKeyDriver](SliderKeyDriver.md) moves it with keys; a slider deaf to keys is dragged along its
    track (`method: 'drag'`). Verified within half a step (or 1% of the range). Errors when there is no
    `aria-valuenow` to read back, or the keys did nothing and there is no track.
