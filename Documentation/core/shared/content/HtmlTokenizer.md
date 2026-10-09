# HtmlTokenizer

`core/shared/content/HtmlTokenizer.js`

Splits an HTML string into `open`, `close` and `text` tokens.

## Methods

- `HtmlTokenizer.tokenize(html)` returns
  `{ type: 'open', name, attributes, selfClosing }`, `{ type: 'close', name }`
  and `{ type: 'text', text }` tokens. Names are lower-cased; attribute values
  (quoted, unquoted or bare) and text are entity-decoded via
  [HtmlEntityDecoder](HtmlEntityDecoder.md); the first of a duplicated
  attribute wins.

## Why

Comments, `<!doctype>` and `<?...?>` are dropped here so nothing downstream
sees them. Raw-text elements (`script`, `style`, `textarea`, `title`, `xmp`)
are read straight to their own close tag: a script containing `"</p>"` or
`a<b` must not be mistaken for markup. A `<` not followed by a letter stays
text, so `5 < 10` survives.
