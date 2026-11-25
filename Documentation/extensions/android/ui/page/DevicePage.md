# DevicePage

`extensions/android/ui/page/DevicePage.js`

The device page served at `/api/ext/android/` (`index.html`, `page.css`).

## Methods

- With `?device=<name>`: connects ([DeviceConnection](DeviceConnection.md)), shows a notice until the first frame is painted, then the screen, with Back, Home and Recents under it.
- When the socket closes it offers Start instead of connecting again by itself, since connecting starts the device.
- Without a device: the list to pick from, or what is missing.
