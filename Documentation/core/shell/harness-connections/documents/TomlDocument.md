# TomlDocument

`core/shell/harness-connections/documents/TomlDocument.js`

Codex's `config.toml` as a [ConfigDocument](ConfigDocument.md) (`ID 'toml'`,
`LABEL 'TOML'`, `EMPTY ''`): smol-toml validates and reads, [TomlScanner](TomlScanner.md)
locates, [TomlRenderer](TomlRenderer.md) writes the inserted text.

## Edits

- Existing key: only its value span is replaced; key spelling, spacing and the
  trailing comment stay.
- New top-level key: after the last top-level key; with none, above the first table
  and the comment block that introduces it (plus a blank separator).
- New key in a table: after the table's last key; in a missing table: a new section.
- Table value: an existing `[path]` section is rewritten where it stands (its
  sub-tables dropped); otherwise any dotted-key fragments are removed and a section is
  appended after a blank line.
- A path inside an inline value (`x = { ... }`): that one value is re-rendered.
- Remove: pairs by their lines (a key alone in its paragraph also takes one blank
  line), sections with the blank lines that separate them from what came before.
- Line ends follow the file. Syntax errors throw `TOML syntax error on line <n>: ...`.
- Array-of-tables entries are not addressable by key; keys inside them are left alone.

## Why

Every add has an inverse that restores the exact text, so key-by-key undo keeps the
user's comments, ordering and layout. Replaces the earlier line-based editor, which
could mistake a `[` inside a multi-line array or string for a table header.
