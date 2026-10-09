# SystemctlArgs

`core/shell/shellClassifier/rules/system/SystemctlArgs.js`

Reads systemctl's verb and units past its value-taking options.

- `SystemctlArgs.positionals(command)`: lowercased positionals, skipping the word after `-H`, `--host`, `-M`,
  `-t`, `-p`, `-s`, `--root`, `-n`, `-o`, `--state`, `--kill-whom`, `--what` and similar (systemctl(1)).

Shared by [PowerControl](PowerControl.md) and [ServiceRequest](ServiceRequest.md) so `systemctl -H box reboot`
is read the same way by both.
