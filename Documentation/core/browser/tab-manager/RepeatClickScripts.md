# RepeatClickScripts

`core/browser/tab-manager/RepeatClickScripts.js`

The in-page probe [RepeatClicker](RepeatClicker.md) runs on every look at the page.

## Members

- `RepeatClickScripts.probe({ text, selector, untilText, untilSelector, untilUrl })` -> script source answering
  `{ success: true, target, until }` or `{ success: false, error }` (an invalid selector).
  - `target`: a visible match is on the page. It is tagged `data-luma-repeat-target`, and the tag is taken off any
    element that no longer matches, so the click lands on the node that was just found.
  - `until`: the stop condition that holds, checked in the order `'url'` (the address contains `untilUrl`),
    `'selector'` (a visible element matches `untilSelector`), `'text'` (the page's visible text contains
    `untilText`), else null.
- `TARGET_ATTR`, `TARGET_SELECTOR`: the tag and the selector the click uses.
- `CLICKABLE`: the elements a label is looked for on when no `selector` is given (links, buttons, button inputs,
  `role=button`, `role=link`, `[onclick]`).

## Matching

Text is compared folded: whitespace runs collapsed, trimmed, lower case. An element's labels are its `aria-label`,
its value (a button input) and its text. An element whose label equals the wanted text wins over an earlier one that
only contains it, so a card that wraps the whole row does not shadow the link inside it. With a `selector` and no
`text` the first visible match is the target; with both, the selector says where the label is looked for.

Hidden (`display: none`, `visibility: hidden`, smaller than 2 px), disabled and `aria-hidden` elements are never the
target, and a hidden element never satisfies `untilSelector`.
