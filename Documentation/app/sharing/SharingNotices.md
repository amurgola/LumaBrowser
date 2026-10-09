# SharingNotices

`app/sharing/SharingNotices.js`

User-facing Network Sharing notices, each in the notification log and as a
native notification.

## Methods

- `new SharingNotices({ notifyModelStatus, notice, log? })`.
- `newClientNotifier()` the notifier SharingHostService calls once per newly
  paired client; `newClient(info)` shows `<peerHint or label or "A device">[ (<ip>)] just paired with Network Sharing.`
  titled `New device connected`, and returns the text.
- `checkPublicUrl(hostService)` runs `checkPublicUrlReachable()`; silent on
  success, skip or no result. On failure it warns `[sharing] Public URL check failed: <error>`,
  logs it as an error and notifies `Public URL not reachable`. Returns the text or null.
