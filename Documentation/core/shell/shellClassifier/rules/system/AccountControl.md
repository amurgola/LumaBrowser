# AccountControl

`core/shell/shellClassifier/rules/system/AccountControl.js`

[HostCapability](HostCapability.md) for user and group accounts. Changes ask.

- Always change: useradd, adduser, userdel, deluser, usermod, groupadd/addgroup/groupdel/delgroup/groupmod, gpasswd,
  chpasswd, chsh, chfn, vipw, vigr, sysadminctl, `New|Remove|Set|Rename|Disable|Enable|Add-Local*` cmdlets.
- Conditional: `passwd` (not `-S`), `chage` (not `-l`), `visudo` (not `-c`), `dscl` write verbs only,
  `net user|localgroup|group` with more than a name or an `/add`, `/delete`, `/active` style option, `net accounts`
  with any option, `net share /delete`.
