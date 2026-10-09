# SkillCommand

`cli/lib/docs/SkillCommand.js`

`luma skill install`: writes the one-paragraph `luma` skill that points an agent at `luma docs`.

## Methods (static)

- `SkillCommand.run(args, { stdout?, stderr?, home?, env? })`: `install` writes the skill and prints
  `installed <file>` per file (exit 0); bare `luma skill` prints the usage line (exit 0); any other
  verb prints it and exits 1.
- `SkillCommand.install({ home?, env? })`: writes `SKILL_MD` and returns the files.
- `SkillCommand.skillPaths({ home?, env? })`: `<CLAUDE_CONFIG_DIR or ~/.claude>/skills/luma/SKILL.md`
  and `~/.agents/skills/luma/SKILL.md`.
- `SkillCommand.SKILL_MD`, `SkillCommand.USAGE`.

## Why

`SKILL_MD` must stay byte-identical with
[HarnessConnections](../../../core/shell/harness-connections/HarnessConnections.md)`.SKILL_MD`, the copy
the desktop app installs from Settings; a test compares them. The CLI cannot require it (the package
must not reach outside `cli/`), hence the duplicate.
