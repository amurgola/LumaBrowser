# TargetScripts

`core/browser/tab-manager/TargetScripts.js`

In-page scripts shared by click and type.

## Methods

- `TargetScripts.resolve({ selector, text, ref })`: finds the target (`[data-luma-ref]` for a ref, else
  the first selector match, filtered by text), marks it `data-luma-click-target`, scrolls it to the
  center, takes the evidence before-snapshot, and returns `{ success, x, y, occluded, fp, tagName, text }`.
- `TargetScripts.syntheticClick()`: `.click()` and focus on the marked element.
- `TargetScripts.typeValue({ text, clear, submit })`: native-setter value set with bubbling `input` and
  `change` (an editable element: `textContent` and `input`), then optional Enter with `requestSubmit()`;
  returns `{ success, submitted }`. A `<select>` and an element that is not a text field are refused by name.
  When the marked target is an `IFRAME` or `FRAME`, the text goes to the field inside it and the reply adds
  `field` (that field's tag name).
- `TargetScripts.FRAME_FIELD_SRC`: the in-page helpers `typeValue` embeds: `isEditable(node)`
  (contenteditable, or a document in design mode), `isTextField(node)` and `frameField(frame)`, which
  returns the frame's focused text field, else its body when the document is editable, else the first
  contenteditable, textarea or non-hidden input it holds, or `null` (a cross-origin frame, or nothing
  editable; `typeValue` then fails with `target frame has no text field this page can reach ...`).
- `TargetScripts.refNumber(ref)`: an integer ref or `null`. `CLICK_TARGET_ATTR`.

## Why

The before-snapshot is taken after our own `scrollIntoView` so that scroll is not reported as the action's effect. The occlusion check (elementFromPoint must hit the target or a relative) decides between trusted input and the page-world fallback, and the mark makes the fallback act on the node that was measured.

A rich-text editor is usually a same-origin frame whose whole document is the editable area, so a frame is a valid typing target. Values and events are set through the constructors of the field's own window (`ownerDocument.defaultView`): the frame's page checks them against its own window, not the parent's.
