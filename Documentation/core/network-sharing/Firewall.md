# Firewall

`core/network-sharing/Firewall.js`

Creates and reports the inbound firewall allow rule that lets LAN devices
reach a sharing host.

## Methods

- `Firewall.ensureAllowed({ exePath, appPath, ports })` elevates through the
  platform prompt and applies the rule. Resolves to `{ success, platform,
  applied? , error?, manual? }`; never throws.
  - Windows: per-program rule via PowerShell under one UAC prompt.
  - macOS: Application Firewall allow-list via an osascript admin dialog.
  - Linux: `ufw allow` per TCP port plus mDNS via pkexec; if ufw is missing
    (exit 66) it returns a `manual` hint instead of an error.
  - Anything else: `manual: 'Unsupported platform.'`
- `Firewall.detect()` resolves to `{ platform, manageable, ruleInstalled,
  publicNetwork, advice }`. Only Windows reports rule state and whether the
  network is Public; elsewhere those are null. Never throws.
- `Firewall.RULE_NAME` is `LumaBrowser LAN Sharing`.

## Why

Desktop OSes block inbound LAN connections by default (Windows most
aggressively), so sharing looks up but other devices silently time out. The
installer creates the rule (build/installer.nsh, same rule name); this class
is the runtime fallback for portable installs, denied prompts and
post-update resets. Windows uses a per-program rule on Private+Domain so it
covers every port the app uses and survives port changes. A Public network
category is the usual reason Windows blocks, hence the specific advice.
