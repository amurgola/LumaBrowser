# PopoverFit

`core/llm-server/ui/js/chat/common/PopoverFit.js`

Keeps a composer-anchored popover inside its clip edge: the top of the nearest
scrolling ancestor (the landing's scroll container), not the viewport. The
popover shrinks first, then slides down over its anchor.

## Methods

- `PopoverFit.clipTop(el, root)`.
- `PopoverFit.fitShrinkingChild(pop, child, root, minPanel)`: the gear panel;
  the tools list absorbs the overflow (the panel keeps overflow visible for the
  nested model popover) down to a 72 px list and a `minPanel` panel.
- `PopoverFit.fitScrolling(pop, root, minHeight)`: the model picker scrolls
  itself down to `minHeight`.
