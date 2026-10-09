# ProfileGroup

`core/shell/shellClassifier/rules/readOnly/ProfileGroup.js`

Base class for static groups of profiles; each subclass implements `static profiles()`.

## Subclasses

[PlainReaderProfiles](PlainReaderProfiles.md), [SearchToolProfiles](SearchToolProfiles.md),
[StreamEditorProfiles](StreamEditorProfiles.md), [ViewerProfiles](ViewerProfiles.md),
[NetworkProfiles](NetworkProfiles.md), [SystemQueryProfiles](SystemQueryProfiles.md),
[ShellBuiltinProfiles](ShellBuiltinProfiles.md).

## Why

Keeps each family of utilities in its own small file with its rationale, composed by
[PosixUtilityCatalog](PosixUtilityCatalog.md).
