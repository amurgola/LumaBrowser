# FigureReplater

`extensions/roleplay-mode/compose/FigureReplater.js`

Re-plates a rendered figure onto a perfect synthetic backdrop.

## Methods

- `FigureReplater.replate(b64, { thr, erode, globalKey, despill, keepLargest, rgb })`;
  returns the original when the key ate the figure (under 5% left).
- `FigureReplater.tryReplate(b64, opts)` null on failure.
