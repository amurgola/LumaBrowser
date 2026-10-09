# ImageBytes

`core/image-server/server/image/ImageBytes.js`

Encodes image or video bytes for a JSON wire body.

## Methods

- `ImageBytes.toBase64(value)`: a Buffer becomes base64, any other non-null
  value goes through `String()` (it is already base64 or a data URL), and
  `null` / `undefined` stay `null`.

## Why

The same encoder was inlined in the image body, the video body and the remote
adapter; one helper keeps the three identical.
