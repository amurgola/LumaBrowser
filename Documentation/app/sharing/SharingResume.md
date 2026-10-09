# SharingResume

`app/sharing/SharingResume.js`

Resumes Network Sharing 3 s after the app is ready (off the boot path).

## Methods

- `new SharingResume({ hostService, clientService, notices, log?, setTimeoutFn? })`.
- `schedule()` runs `run()` after `SharingResume.DELAY_MS` (3000).
- `run()` returns a promise: when the host was left enabled it calls
  `hostService.setEnabled(true)` (advertise over mDNS, start the TLS listener
  and, when on, the web backend) and warns `[sharing] resume failed:` on a
  failed result; then it checks the public URL
  ([SharingNotices](SharingNotices.md)). The peer manifest poll starts either
  way (it self-unrefs and no-ops without peers). Client mDNS browsing stays
  lazy.
