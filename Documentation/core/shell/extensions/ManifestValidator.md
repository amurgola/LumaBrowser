# ManifestValidator

`core/shell/extensions/ManifestValidator.js`

Checks a manifest for required fields and common mistakes.

## Methods

- `ManifestValidator.validate(manifest, extDir)` returns issue strings, empty
  when valid. A missing `id` or `name` returns only
  `FATAL: missing "id" field` / `FATAL: missing "name" field`. Warnings: non
  kebab-case id, non-boolean `debugOnly`, non-string `main`/`renderer`, a
  missing main or renderer file, `navigationBar.label` missing, a bad
  `navigationBar.panel.location` (one of `bottom-bar, right-sidebar,
  right-panel, bottom, right`), `settings.label` missing, `settings.placement` not `extensions` or `tab`, an Extensions-area
  action without `label` or `modeIntent`, and a bad `dashboard` block (not an
  object; a widget without a kebab-case `id`, a `title` or an existing `file`;
  a missing asset; `api` not an array of strings).
- `ManifestValidator.fatalIssues(issues)` the FATAL ones.
