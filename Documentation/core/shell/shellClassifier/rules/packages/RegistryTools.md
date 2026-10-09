# RegistryTools

`core/shell/shellClassifier/rules/packages/RegistryTools.js`

[ToolFamily](ToolFamily.md) for language package managers, grouped by ecosystem (JavaScript, Python, compiled
languages, others).

## Table

- Publish: `npm`/`pnpm`/`bun`/`deno`/`poetry`/`uv`/`pdm`/`hatch`/`flit` `publish`, `twine upload`, `yarn [npm] publish`,
  `cargo publish`, `gem push`, Maven `deploy` / `*:deploy` / `release:perform` (`mvn`, `mvnw`), Gradle tasks starting
  `publish` unless they end `ToMavenLocal` (project path ignored), `[dotnet] nuget push`, `mix hex.publish`,
  `swift package-registry publish`, `npm dist-tag add|rm`, `yarn [npm] tag add|remove`.
- Withdraw: `npm unpublish|deprecate`, `cargo yank`, `gem yank`, `[dotnet] nuget delete`, `mix hex.retire`.
- Registry access: npm `owner|author add|rm`, `access grant|revoke|set|...`, `team create|destroy|add|rm`,
  `org set|rm`, `token create|revoke`, `hook add|rm|update`, `login|adduser|logout`; yarn owner/login; `cargo owner`
  and `gem owner` with an add or remove option; `cargo login|logout`; `gem signin|signout`; `mix hex.owner add|remove|transfer`.
- Cache wipe: `npm cache clean`, `yarn cache clean`, `bun pm cache rm`, `uv cache clean`, `pip cache purge`,
  `[dotnet] nuget locals --clear`, `go clean -modcache`, `composer clear-cache|clearcache|cc`.
- Unconfirmed removal: `pip uninstall -y|--yes`.

## Why

Only write verbs are listed, so read forms (`npm owner ls`, `cargo owner --list`, `gem owner x`) fall through. Gradle
names a publish task after its destination, so the suffix decides whether it leaves the machine.
