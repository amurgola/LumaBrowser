# CommandProfile

`core/shell/shellClassifier/rules/readOnly/CommandProfile.js`

Base class for anything that judges a command for read-only use: owns its frozen `names` (at least one) and
implements `judge(name, args)` returning a [ReadOnlyVerdict](ReadOnlyVerdict.md).

## Subclasses

[UtilityProfile](UtilityProfile.md) (option-driven) and [PredicateProfile](PredicateProfile.md) (subcommand-driven).

## Why

Catalogs index any profile by name without caring how it decides.
