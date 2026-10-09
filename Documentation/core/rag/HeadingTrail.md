# HeadingTrail

`core/rag/HeadingTrail.js`

The chain of headings in force at a point of a document, e.g.
`['Guide', 'Install']`.

## Methods

- `enter(level, title)`: closes every open heading of the same or a deeper
  level, then opens this one (an empty title opens nothing). Returns the
  heading's parents.
- `titles()`: a copy of the current trail.

## Why

[BlockUnitizer](BlockUnitizer.md) stamps the trail on every unit so
[TextChunker](TextChunker.md) can name the section each chunk came from.
