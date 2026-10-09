# CitationTag

`core/rag/CitationTag.js`

The tag a retrieved passage is cited by.

## Methods

- `CitationTag.at(position)`: `'S1'` for position 0, `'S2'` for 1, ...
- `CitationTag.PREFIX` (`'S'`).

## Why

The same string is written into the model's context as `[S1]`
([PassageCitationRenderer](PassageCitationRenderer.md)) and carried as `ref`
on the source card ([SourceCardBuilder](SourceCardBuilder.md)), so a tag in the
answer maps back to its source by plain string equality. A letter prefix keeps
`[S2]` from being confused with a footnote, list number or year already in the
text, which a bare `[2]` could be.
