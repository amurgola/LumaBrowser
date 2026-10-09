# TargetScripts

`core/browser/tab-manager/TargetScripts.js`

In-page scripts shared by click and type.

## Methods

- `TargetScripts.resolve({ selector, text, ref })`: finds the target (`[data-luma-ref]` for a ref, else
  the first selector match, filtered by text), marks it `data-luma-click-target`, scrolls it to the
  center, takes the evidence before-snapshot, and returns `{ success, x, y, occluded, fp, tagName, text }`.
- `TargetScripts.syntheticClick()`: `.click()` and focus on the marked element.
- `TargetScripts.typeValue({ text, clear, submit })`: native-setter value set with bubbling `input` and
  `change` (contenteditable: `textContent`), then optional Enter with `requestSubmit()`; returns `{ success, submitted }`.
- `TargetScripts.refNumber(ref)`: an integer ref or `null`. `CLICK_TARGET_ATTR`.

## Why

The before-snapshot is taken after our own `scrollIntoView` so that scroll is not reported as the action's effect. The occlusion check (elementFromPoint must hit the target or a relative) decides between trusted input and the page-world fallback, and the mark makes the fallback act on the node that was measured.
