# HtmlToMarkdown

`core/shared/content/HtmlToMarkdown.js`

Dependency-free HTML to Markdown conversion for model consumption. The entry
point of a small pipeline of cooperating classes.

## Methods

- `HtmlToMarkdown.convert(html, { baseUrl })` returns Markdown for an HTML
  string (null and undefined give `''`). `baseUrl` (optional) is the page's own
  URL; relative links resolve against it (refined by any `<base href>`).
  Without it, relative links keep only their text.
- `new HtmlToMarkdown(html, options).execute()` runs one conversion.

## Pipeline

1. [HtmlTokenizer](HtmlTokenizer.md) then [HtmlTreeBuilder](HtmlTreeBuilder.md):
   a forgiving tree of [HtmlNode](HtmlNode.md)s.
2. [UrlResolver](UrlResolver.md) from `baseUrl` and `<base href>` (read before
   pruning removes `<head>`).
3. [InvisibleContentPruner](InvisibleContentPruner.md) cuts what is never prose.
4. [ContentRootLocator](ContentRootLocator.md) narrows to `<main>`, a lone
   `<article>`, or the body.
5. [BoilerplatePruner](BoilerplatePruner.md) cuts chrome and link-dense blocks.
6. [MarkdownRenderer](MarkdownRenderer.md) writes what remains.

## Why

There is no HTML parser in the dependency tree, and the output is for a model,
not for round-tripping. Markdown keeps the structure that helps a model reason
(headings, lists, tables, fenced code with a language, link targets) at a
fraction of the tokens of HTML. Building a tree first, rather than reacting to
tags as they stream past, is what makes the content heuristics possible: they
need each block's text and link totals before deciding to keep it.

Element categories, thresholds and heuristics were derived independently from
public material: boilerplate-detection research on block link density and text
density, the HTML parsing model (void, raw-text and implied end tags), ARIA
landmark roles, and the class conventions of common syntax highlighters.

Consumers: [PageSource](../../browser/tab-manager/PageSource.md) (passes the tab
URL), [PageText](../../llm-server/chat/web-tools/PageText.md) (passes the
fetch's final URL), the web search rendered-page fallback, and RAG HTML parsing
([DocumentParser](../../rag/DocumentParser.md)).

Line breaks are normalized to `\n` before tokenizing (as HTML parsers do), so a CRLF page never leaks `\r` into fenced code.
