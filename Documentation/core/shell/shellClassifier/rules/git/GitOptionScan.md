# GitOptionScan

`core/shell/shellClassifier/rules/git/GitOptionScan.js`

Reads git option words the way git's parse-options does. Every git sub-check asks through it.

## Methods

- `optionWords(words)`: words before a bare `--`.
- `names(word, longName)`: `--name`, `--name=value`, or an abbreviation of at least 3 letters. A real option that
  prefixes a longer one (`--text`, `--force`, `--output`, ...) means itself.
- `hasLong(words, ...names)`, `hasShort(words, letter)` (bundles like `-fdx`), `has(words, { long, short, values })`
  (`values` options swallow the next word first, so `--sort -committerdate` is not `-c -o -m ...`).
- `withoutValues(words, valueOptions)`, `keyOf(word)`.
- `walk(words, spec)` -> `{ known, positionals, seen }`. spec: `switches`, `values` (next word or glued),
  `attached` (only `=`/glued), `lastArgDefault` (next word when present, as `--contains [<commit>]`).

## Why

git accepts `--out=x` for `--output=x` and `-uf` for `-u -f`; matching only exact words lets those through. Erring
toward a match (an ambiguous abbreviation counts) only ever makes the rule ask more.
