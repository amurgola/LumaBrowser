# ServiceControl

`core/shell/shellClassifier/rules/system/ServiceControl.js`

[HostCapability](HostCapability.md) for service-manager calls (see [ServiceRequest](ServiceRequest.md)).

- Forbidden: a halting action on a [critical service](CriticalServices.md) (every unit is checked, so
  `systemctl stop nginx sshd` is caught), or a launchd bootout/kill of a whole domain (`system`, `gui/<uid>`,
  `user/<uid>`), which ends the login session. The reason names the service and its consequence.
- Mass-destructive: any other halt or change: `<label> <action> changes a system service.` Restarting a critical
  service asks rather than forbids: it comes back.
- Inspection has no opinion.
