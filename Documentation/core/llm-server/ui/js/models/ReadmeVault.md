# ReadmeVault

`core/llm-server/ui/js/models/ReadmeVault.js`

Holds pre-built safe markup behind sentinel tokens (NUL, "B", index, NUL). A token has no `<`, `>` or `&`, so it passes the escape step untouched.

## Methods

- `stash(html)` returns the token; `restore(html)` swaps tokens back (up to 5 passes, since a vaulted block can contain tokens); `ReadmeVault.isTokenLine(line)`.
- An unknown index restores to an empty string, so a token-looking string in the README injects nothing.

## Globals

None.
