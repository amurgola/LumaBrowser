# MonacoLanguages

`core/llm-server/ui/js/monaco/MonacoLanguages.js`

Maps an artifact's language tag or a file name to a Monaco language id.

## Methods

- `MonacoLanguages.languageFor(label)` lowercases and trims `label`, takes the
  last extension when it contains a dot (`'deploy.ps1'` -> `ps1`), and looks it
  up in `MAP` (`toml` maps to `ini`, `svg` to `xml`, ...). Unknown is
  `'plaintext'`.
- `MonacoLanguages.resolveLanguage(language, name)`: the tag wins; an absent or
  unknown tag falls back to the title or file name.

## Bug fixed

Legacy looked the key up with `MAP[k] || 'plaintext'`, so a label such as
`constructor` or `notes.toString` returned an Object prototype function instead
of a language id. The lookup is now own-property only (tested).

## Globals

None.
