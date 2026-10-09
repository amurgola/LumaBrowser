# PassageCitationRenderer

`core/rag/PassageCitationRenderer.js`

Writes retrieved passages into the model's context.

## Methods

- `PassageCitationRenderer.render(passages)` returns one section per passage,
  sections on consecutive lines, or `''` for none:

  ```
  [S1] guide.pdf, page 3
  """
  the passage text
  """
  [S2] notes.md
  """
  ...
  """
  ```

  The tag comes from [CitationTag](CitationTag.md). The page is left out when
  null (page 0 is kept); a missing filename reads `untitled document`.
  Brackets and line breaks are removed from filenames, so a filename cannot
  fake a tag or a section, and runs of three or more double quotes in a passage
  are shortened to two, so a passage cannot close its fence.

## Why

Small local models copy what they see: putting the exact `[S1]` token at the
head of each passage, and asking for it after each fact (see
[KnowledgeLookupOutcome](KnowledgeLookupOutcome.md)), makes the citation a
copy rather than a recall. Triple-quote fences are a widely used prompt
delimiter for quoted material, and unlike Markdown headings they cannot be
confused with the headings inside Markdown documents (the documentation
knowledge base is all Markdown).
