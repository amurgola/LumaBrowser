# ReadmeInline

`core/llm-server/ui/js/models/ReadmeInline.js`

Renders one inline run for the README renderer: `<a href>` becomes a vaulted inert link (http and https only; other links keep their text), `b/strong`, `i/em`, `code/kbd/tt` tags become Markdown delimiters, the rest is escaped, then images (alt text), links, inline code, bold and italics are applied to the escaped text.

## Methods

- `new ReadmeInline(vault).render(raw)`; `ReadmeInline.stripTags(value)`.

## Globals

None.
