# AutomationSection

`extensions/personal-hub/ui/settings/AutomationSection.js`

The Hub settings tab's automation access: the inbound base URL and bearer
token an automation (n8n) uses to push queue items and enrich threads, with
Copy and Rotate, and the two example payloads.

## Behaviour

- `load()` calls `getInboundInfo` -> `{ token, baseUrl, queueUrl, enrichUrl,
  oauthCallbackUrl }`, fills the key/value rows and hands the info to
  `onInfo` (the tab passes the OAuth callback URL to the calendar section).
- Copy writes the token to the clipboard and flashes `Copied`
  ([SavedBadge](../../../ui-kit/ui/SavedBadge.md)); Rotate confirms
  (`Rotate the token? Every automation using the old one must be updated.`)
  then calls `rotateInboundToken` and shows the new token.
- The examples: `QUEUE_EXAMPLE` for `POST <queueUrl>` (`app`, `threadKey`,
  `title`, `summary`, `priority`, `participants`, `url`, `labels`, `body`) and
  `ENRICH_EXAMPLE` for `POST <enrichUrl>` (`id` or `app` + `threadKey`,
  `summary`, `priority`, `labels`, `context`, `taskId`), both with
  `Authorization: Bearer <token>`. The help notes that the Notifications tab's
  webhook keeps forwarding every intercepted notification to the automation.

## IPC

`getInboundInfo`, `rotateInboundToken`.

## Globals

`navigator.clipboard`.
