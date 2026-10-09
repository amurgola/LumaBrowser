# InteractableElements

`core/browser/tab-manager/InteractableElements.js`

The interactable-element list for the LLM selector fallback.

## Methods

- `InteractableElements.list(page, { limit = 80, includeHidden })` -> `{ success, data: [{ selector, tag, text, role, ariaLabel,
  placeholder, name, type, dataTestId, dataRole, id, disabled, visible }], truncated }`; empty attributes
  are dropped and `limit` is clamped to 1..200.
- `InteractableElements.script(limit, includeHidden)`.

## Why

Selector preference: authored id, data-testid, data-role, tag + aria-label, tag + name, then nth-of-type (scoped by an authored parent id). Hashed ids ([SelectorKit](../extraction/SelectorKit.md)) are skipped: they match today and vanish next deploy, after the model stored them (BUG_BACKLOG M30).
