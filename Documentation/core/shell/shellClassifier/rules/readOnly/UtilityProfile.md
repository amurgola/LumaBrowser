# UtilityProfile

`core/shell/shellClassifier/rules/readOnly/UtilityProfile.js`

Capability profile of one utility ([CommandProfile](CommandProfile.md)).

## Fields

- `names`, `summary` (phrase for the read reason), `grammar` ([OptionGrammar](OptionGrammar.md)).
- `hazards`: [OptionHazard](OptionHazard.md) list.
- `maxOperands: { count, why }`: for tools whose next operand is an output file (`uniq in out`, `xxd in out`) or a
  setting (`hostname name`, `umask 022`).
- `requires: { test(scanned), why }`: tools that only read in one mode (`ping -c`, `top -b`).
- `inspect(scanned)`: content check returning a refusal phrase (sed scripts, awk programs, `date` operands).

## Methods

- `UtilityProfile.plain(names, summary)`: never writes whatever its options.
- `judge(name, args)`: scans, then checks hazards, operands, required mode and inspector, in that order.

## Why

Most utilities fit "never writes / writes when flag / executes when flag / reads only in a mode"; one declarative
shape keeps each entry a few lines of data with its rationale beside it.
