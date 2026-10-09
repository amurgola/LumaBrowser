# BoilerplatePruner

`core/shared/content/BoilerplatePruner.js`

A [TreePruner](TreePruner.md) that removes page chrome from the content root.

## Methods

- `BoilerplatePruner.prune(root)` measures the root with
  [NodeTextStats](NodeTextStats.md), then drops:
  - chrome landmarks (`nav`, `aside`, `footer`);
  - `CHROME_ROLES`: ARIA `banner`, `navigation`, `contentinfo`,
    `complementary`, `search`, `menu`, `menubar`;
  - `CHROME_TOKEN`: whole class or id tokens of common widgets (cookie
    banners, breadcrumbs, share bars, skip links, screen-reader-only text);
  - link-dense containers: a `DENSITY_CANDIDATES` element (div, section,
    header, ul, ol, menu, dl, table) with at least `MIN_LINKS` (3) links and a
    link density of at least `MAX_LINK_DENSITY` (0.6).

## Why

Navigation is mostly anchor text; prose mostly is not. Research on text-block
classification puts the cut near a third, but that is per text block. This
judges whole containers, so the bar is higher to spare passages dense with
citations. Paragraphs are never density candidates, and fewer than three links
is a sentence with a link, not a menu. When the root itself is link-dense (a
search result list, a link index) the links are the content, so density is not
judged at all. Class tokens are matched whole so `shared-notes` is not taken
for a share bar.
