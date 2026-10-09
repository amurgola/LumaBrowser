# ShellQuote

`core/network-sharing/ShellQuote.js`

Quotes strings as single-quoted shell literals.

## Methods

- `ShellQuote.powershell(value)` wraps in `'...'`, doubling embedded quotes.
- `ShellQuote.posix(value)` wraps in `'...'`, turning each embedded quote into
  `'\''`.
