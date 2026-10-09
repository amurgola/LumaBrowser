# HostCapability

`core/shell/shellClassifier/rules/system/HostCapability.js`

Base class for one host-control capability judged by [SystemRule](../SystemRule.md).

## Methods

- `covers(command)`: true when the capability owns the [HostCommand](../HostCommand.md). Owning stops the search
  even if `judge` then has no opinion.
- `judge(command)`: a forbidden or mass-destructive verdict, or `null` when the call only reads.
- `HostCapability.forbid(reason)`, `HostCapability.ask(reason)`: verdict builders; a falsy reason gives `null`.
