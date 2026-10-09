# HtmlTreeBuilder

`core/shared/content/HtmlTreeBuilder.js`

Builds an [HtmlNode](HtmlNode.md) tree from [HtmlTokenizer](HtmlTokenizer.md)
tokens.

## Methods

- `HtmlTreeBuilder.build(tokens)` returns a `#document` root node.

## Why

Real pages omit end tags. `IMPLIED_ENDS` encodes the common cases browsers
apply: a block (`PARAGRAPH_ENDERS`) closes an open `<p>`; `li`, `dt`/`dd`,
`tr`, `td`/`th`, row groups and `option` close their open sibling. Each rule
has a `within` barrier so a nested list or table never closes its outer one.
A close tag with no open match is ignored; one with a match pops everything
above it. `/>` is honoured on any element (inline SVG and XHTML use it), void
elements never take children, and nesting stops at `MAX_DEPTH` (400) so
unclosed-tag soup cannot exhaust the stack in the recursive passes after it.
