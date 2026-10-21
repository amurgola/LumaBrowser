# settings.html

`extensions/site-apis/settings.html`

The Settings > Site APIs page (manifest `settings.placement: 'tab'`), mounted by the shell's slot manager before the
renderer activates. Static markup only; [SettingsPage](ui/SettingsPage.md) fills it.

## Elements

- `#ext-sapi-newBtn`: New site API; `#ext-sapi-summary`: the "2 sites, 5 endpoints, 3 validated." line;
  `#ext-sapi-picker`: the persisted-tab picker card (hidden until New site API is clicked).
- `#ext-sapi-sites`: one `.luma-card.sapi-site` per site, built by [SiteCard](ui/SiteCard.md).
- A closing "Chat tools" field describing the `siteapi_*` and `site_apis_*` tools.

## Decisions

The page's own `.sapi-*` rules live in a `<style>` block at the top of the file (the shared ui-kit classes
`luma-card`, `luma-badge`, `luma-btn`, `luma-field`, `luma-code`, `luma-error`, `luma-empty` and `ext-divider`
carry the rest), so the extension ships no CSS file and `extensions/extension-styles.css` stays untouched.
