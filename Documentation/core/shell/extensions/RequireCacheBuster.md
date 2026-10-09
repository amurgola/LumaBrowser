# RequireCacheBuster

`core/shell/extensions/RequireCacheBuster.js`

Forgets every cached module loaded from an extension directory, so a reinstall
loads new code (routes, tools and helpers too, not just manifest.js).

## Methods

- `RequireCacheBuster.bust(dir, cache = require.cache)` deletes entries under
  `<dir><sep>` (never a sibling sharing the prefix); returns the count.

Under jest the real `require.cache` is not jest's module registry, so the
update path is tested in a child Node process (ExtensionManager.test.js).
