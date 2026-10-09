# ToolchainCatalog

`core/shell/shellClassifier/rules/readOnly/ToolchainCatalog.js`

[ReadOnlyCatalog](ReadOnlyCatalog.md) of [PredicateProfile](PredicateProfile.md)s consulted first in every dialect.

- Tables: `RUNTIMES` (version/help flags only), `PACKAGE_MANAGERS` (npm, pnpm, yarn, bun, pip, uv, poetry, cargo,
  go, gem, composer), `BUILD_TOOLS` (make -n, tsc --noEmit, eslint/prettier checks), `PLATFORMS` (docker,
  kubectl, helm, terraform, aws, gcloud, az, gh, wsl), `SYSTEM_PACKAGES` (choco, winget, scoop, brew, apt, dpkg,
  pacman, dnf), `SERVICES` (systemctl, journalctl, launchctl, sc, net, reg, schtasks, wmic, route, arp, netsh,
  tasklist, mount, crontab).
- `ALIASES`: pip3 shares pip, yum shares dnf.
- Never read: npx, taskkill, and git (named as [GitRule](../GitRule.md) territory so no other catalog claims it).
- Predicate builders: `first`, `firstIn`, `onlyFlags`, `leadingFlag`, `anyOf`; `_githubReads` for gh.

## Why

Toolchains read in their list and inspect subcommands only; each predicate says which. `crontab -l` now also
refuses `-r`/`-e` in the same call.
