# HubItemMapper

`extensions/android/relay/HubItemMapper.js`

Turns a notification a device raised into a Personal Hub queue item (`HubService.pushQueueItem`).

## Methods

- `HubItemMapper.toQueueItem(deviceName, notification)`: the Hub's app key for an Android app it also knows from the web (`KNOWN`: Slack, Teams, Outlook, WhatsApp, Telegram, Discord, Proton), else the package name; the title is the sender and the thread; label `android`; `context` carries the device, package and key.
