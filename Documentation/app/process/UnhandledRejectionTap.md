# UnhandledRejectionTap

`app/process/UnhandledRejectionTap.js`

The process-wide unhandled-rejection listener.

## Methods

- `UnhandledRejectionTap.install(proc?, log?)` adds one listener.
- `UnhandledRejectionTap.handle(reason, log?)` false for `Script failed to execute`
  (dropped), else logs `[main] unhandled rejection: <stack or message>` and returns true.
- `UnhandledRejectionTap.messageOf(reason)`.

## Why

@ghostery/adblocker-electron injects cosmetic scriptlets with a bare
`executeJavaScript`, so a scriptlet failing on a hostile page surfaces as an
unhandled "Script failed to execute" rejection, several stack dumps per boot.
The app's own `executeJavaScript` calls all attach handlers, so that message is
pure noise. Registering any listener disables Node's default printer, so
everything else is still logged.
