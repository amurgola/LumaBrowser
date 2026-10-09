# PackagesRule

`core/shell/shellClassifier/rules/PackagesRule.js`

[ShellRule](../ShellRule.md) for package registries, containers, Kubernetes, cloud CLIs, infrastructure-as-code,
databases and the PowerShell cmdlets that do the same jobs. It only ever returns mass-destructive (always ask) or
`null`.

## Methods

- `rule.assess({ name, args })` -> `{ tier: 'mass-destructive', reason }` or `null`.
- `PackagesRule.reasonFor(name, args)` -> the approval-card sentence or `null`.
- `PackagesRule.findingFor(name, args)` -> `{ effect, subject, scope, preview }` or `null`, after rehearsal flags.
- `PackagesRule.FAMILIES` -> the tool families, asked in order; the first that `handles` the tool decides.

## Design

Knowledge lives in declarative per-tool tables, one [ToolFamily](packages/ToolFamily.md) per area:
[RegistryTools](packages/RegistryTools.md), [ContainerTools](packages/ContainerTools.md),
[ClusterTools](packages/ClusterTools.md), [CloudTools](packages/CloudTools.md),
[InfrastructureTools](packages/InfrastructureTools.md), [DatabaseShellTools](packages/DatabaseShellTools.md),
[SchemaTools](packages/SchemaTools.md) and [CmdletTools](packages/CmdletTools.md). Each row maps subcommand words
(and optionally options) to a [RiskEffect](packages/RiskEffect.md). [VerbTable](packages/VerbTable.md) does all the
matching over a [ToolArgs](packages/ToolArgs.md) view, and [PreviewFlags](packages/PreviewFlags.md) drops findings
whose row is previewable when the command is a `--dry-run` / `-WhatIf` rehearsal.

Reasons read `<what ran> (<scope>) <consequence>`, for example
`kubectl delete (whole namespaces, volumes or every resource) tears down live infrastructure, a deployment or a cloud resource.`

## Why

Nothing here is forbidden. A publish, a prune, a `terraform destroy` or a `DROP TABLE` can be exactly what the user
asked for, so these always ask rather than being auto-denied. Installs and builds have no rows and stay normal.

The tables were written from each tool's own CLI reference (npm, pnpm, Yarn, Bun, Deno, pip, uv, Poetry, PDM, Hatch,
Flit, twine, Cargo, RubyGems, Maven, Gradle, dotnet/NuGet, Go, Composer, Mix/Hex, SwiftPM, Docker/Podman/nerdctl and
Compose, kubectl/oc, Helm, AWS CLI, Azure CLI, gcloud, doctl, flyctl, Heroku, Vercel, Netlify, Railway, Wrangler,
Terraform/OpenTofu, Terragrunt, Pulumi, AWS CDK, CDKTF, SST, Serverless, Vagrant, the PostgreSQL/MySQL/MongoDB/Redis
clients, sqlcmd, sqlite3, the migration tools, PowerShellGet, Az PowerShell and AWS Tools for PowerShell). Read forms
of write verbs (`npm owner ls`, `terraform state list`) are left out by listing the write verbs, not by excluding reads.

## Behaviour changes from the previous version

- Rehearsals no longer ask always: `--dry-run`, `--dryrun`, `--preview-only`, `-WhatIf` on previewable rows.
- Global options before the subcommand no longer hide it (`kubectl -n prod delete pod x`, `npm --prefix p publish`).
- Newly covered: Deno, PDM, Hatch, Flit, `bun pm cache rm`, `uv`/`pip`/`yarn`/`composer`/NuGet cache wipes,
  `go clean -modcache`, `mvnw`, `cargo login`, `gem signin`, `docker buildx prune`, `podman system reset`,
  `podman-compose`, `--mount source=/`, `kubectl rollout undo`, `kubectl scale --replicas 0` (space form), OpenTofu,
  CDKTF `--auto-approve`, Serverless `remove`, every `pulumi state` subcommand, `terraform untaint`, duckdb,
  `UPDATE` without `WHERE`, Mongo empty-filter deletes, `rake`, Flyway `clean`, Liquibase `dropAll`,
  `knex migrate:rollback --all`, `drizzle-kit push --force`, PowerShell Gallery publishing, `Remove-Az*`, AWS Tools
  removals and `Invoke-Sqlcmd`.
- No longer asked: `npm star`/`unstar`; `cdk deploy --force` (forces a redeploy, does not skip approval);
  `drizzle-kit drop` (deletes a local migration file); Gradle `publish...ToMavenLocal` tasks (local only).
- Every reason was rewritten around its effect; `compose down --rmi` and `compose rm -f` now say they remove images or
  skip confirmation instead of claiming volume loss.
- Cloud deletes use each CLI's own vocabulary (`aws <service> delete-*|terminate-*|deregister-*|purge-*`,
  `az ... delete|purge`, `heroku x:destroy`) instead of one shared word list; `aws s3 rb` without `--force` now asks.

## Previous API

| Before | Now |
| --- | --- |
| `PackagesRule.massDestructiveReason(name, args)` | `PackagesRule.reasonFor(name, args)` |
| `LANG_PM`, `CONTAINER`, `KUBE`, `CLOUD`, `IAC`, `DB_SHELL`, `DB_UTIL`, `PUBLISH` statics | the family tables (`family.table.tools`) and `RiskEffect` |
