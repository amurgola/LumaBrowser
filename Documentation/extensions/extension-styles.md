# extension-styles.css

`extensions/extension-styles.css`

Shared styles for the bundled extensions' main-window UI (checkbox groups,
collapsible details, and layout glue under the `.tt-`, `.pcd-`, `.nw-`, `.ni-`
and `.th-` namespaces), composed from the `.luma-*` library on the
tokens in `tokens.css`. `index.html` links it right after
`core/llm-server/ui/css/luma-components.css`.

It follows the [design system](../ui/DesignSystem.md): sizes, spacing and
radii come from the `--text-*`, `--space-*` and `--radius-*` tokens; the
`.ext-details` disclosure is sentence case (no mono uppercase accent label);
`.ext-card` has a neutral header; the page monitor diff is a sunken code
block whose added and removed lines are tinted with `--success-dim` and
`--danger-dim` (no colored left stripes).
