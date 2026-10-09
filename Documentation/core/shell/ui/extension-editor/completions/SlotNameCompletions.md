# SlotNameCompletions

`core/shell/ui/extension-editor/completions/SlotNameCompletions.js`

In renderer.js inside `slotManager.register("`: the six UI slots (`SLOTS`)
matching the typed name; the item's range covers the whole typed name.

## Bug fixed

Legacy built the prefix as `<first word>-<rest>`, so nothing matched until a
hyphen was typed (`"set"` became `set-`), an empty string matched nothing, and
the word range left the typed part before the hyphen in place.
