# AccessibleAttributeMatcher

`core/browser/tab-manager/AccessibleAttributeMatcher.js`

Plain-language description to a CSS selector without an LLM.

## Methods

- `AccessibleAttributeMatcher.find(page, description)` -> `{ success, selector, strategy }` or `No deterministic match`.
  Strategies in order: `data-testid-slug`, `data-testid-raw`, `aria-label`, `placeholder`,
  `data-role-slug`, then `visible-text-exact`; the first with exactly one visible match wins and is
  re-expressed as the element's most stable selector.
- `AccessibleAttributeMatcher.slug(text)`: `Add to Cart!` -> `add-to-cart`.
- `AccessibleAttributeMatcher.script(description, slug)`.
