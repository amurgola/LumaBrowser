# ActivityLogMarkup

`extensions/activity-log/ui/ActivityLogMarkup.js`

The Activity Log settings tab markup.

## Members

- `ActivityLogMarkup.SETTINGS_HTML`: the controls section (`#al-master-toggle`,
  `#al-retention-days`, `#al-retention-rows`, `#al-refresh-callers-btn`,
  `#al-clear-btn`, `#al-save-status`), the per-caller section
  (`#al-caller-count`, `#al-caller-list`), the viewer (`#al-filter-caller`,
  `#al-filter-result`, `#al-filter-search`, `#al-refresh-entries-btn`,
  `#al-entry-list`, `#al-entry-detail`), and the tab's `.al-*` styles in an
  inline `<style>`. The styles stay inline because the settings slot takes one
  HTML string and the manifest has no stylesheet field for shell renderers.
