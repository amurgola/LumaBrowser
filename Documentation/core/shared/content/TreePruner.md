# TreePruner

`core/shared/content/TreePruner.js`

Base class for passes that remove subtrees from an [HtmlNode](HtmlNode.md) tree.

## Methods

- `prune(root)`: walks top-down, removes each element child for which
  `shouldDrop(node)` is true, recurses into the rest, and returns `root`.
- `shouldDrop(node)`: override; the base keeps everything.

## Why

[InvisibleContentPruner](InvisibleContentPruner.md) and
[BoilerplatePruner](BoilerplatePruner.md) differ only in their rule. Walking
top-down means a dropped block's descendants are never examined.
