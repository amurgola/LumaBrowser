# HubMapper

`extensions/desktop-integration/features/notifications/HubMapper.js`

Maps a normalized OS notification ([OsNotification](OsNotification.md)) to a
Personal Hub queue item for `HubService.pushQueueItem`
([InboxService.pushItem](../../../personal-hub/inbox/InboxService.md)).

- `KNOWN`: desktop apps the Hub also sees on the web, each with its Hub app key,
  the web host the Hub classifier uses, display names and AUMID patterns:
  slack, teams, outlook, whatsapp, telegram, discord, clickup, proton.
- `static hubAppFor(item)`: the Hub app key by display name (exact) or AUMID
  pattern, else ''.
- `static toQueueItem(item)` ->
  `{ app, threadKey, title, body, sender, participants, at, url, labels?, context }`; `labels: ['os-notification']`
  only for apps the Hub does not know (the Hub replaces a thread's labels on push, so shared web threads keep theirs).
  - Known app: `app` is the Hub key; sender and thread key come from the Hub's
    [NotificationClassifier](../../../personal-hub/inbox/NotificationClassifier.md)
    given the app's web host, so the toast lands on the same thread as the web
    notification would.
  - Other apps: `app` is the display name; thread key
    `<aumid>|group:<group>`, `<aumid>|tag:<tag>`, or `<aumid>|<normalized title>`
    (normalized with the Hub's [ThreadKey](../../../personal-hub/inbox/ThreadKey.md)).
  - `url`: the launch URI when http(s); `context`: `{ source: 'desktop', osApp, appId, client, tag, group, launchUri, imagePath }`.

The classifier and ThreadKey are required from the personal-hub folder inside
try/catch: without them the generic mapping still works.
