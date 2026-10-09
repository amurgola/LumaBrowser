# PosixUtilityCatalog

`core/shell/shellClassifier/rules/readOnly/PosixUtilityCatalog.js`

[ReadOnlyCatalog](ReadOnlyCatalog.md) built from every POSIX [ProfileGroup](ProfileGroup.md) in `GROUPS`:
[PlainReaderProfiles](PlainReaderProfiles.md), [SearchToolProfiles](SearchToolProfiles.md),
[StreamEditorProfiles](StreamEditorProfiles.md), [ViewerProfiles](ViewerProfiles.md),
[NetworkProfiles](NetworkProfiles.md), [SystemQueryProfiles](SystemQueryProfiles.md),
[ShellBuiltinProfiles](ShellBuiltinProfiles.md).

## Why

One catalog for POSIX shells and for git-bash tools reached from PowerShell or cmd; the constructor's duplicate
check guarantees no two groups claim the same name.
