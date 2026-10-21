# CrxArchive

`core/chrome-extensions/store/CrxArchive.js`

Splits a Chrome Web Store package (`.crx`, version 2 or 3) into its zip
payload and the publisher's public key, and derives the extension id.

## Methods

- `CrxArchive.parse(buffer)` returns `{ version, zip, publicKey, id }`. Throws
  for a buffer without the `Cr24` magic, an unknown version, or a header that
  runs past the end of the buffer.
- `CrxArchive.idFromPublicKey(key)`: the first 16 bytes of the key's SHA-256,
  one letter `a..p` per hex nibble (Chrome's id encoding).
- `CrxArchive.idFromHex(hex)`: the nibble-to-letter step on its own.

## Why

CRX3 headers carry several key proofs: the publisher's and the store's own.
The publisher's is the one whose hash starts with `signed_header_data.crx_id`,
so the parser matches on that instead of taking the first proof. The key is
what [ChromeStoreInstaller](ChromeStoreInstaller.md) pins into `manifest.json`
so Electron gives the extension its store id.

The header is protobuf; [ProtobufFields](ProtobufFields.md) reads it without a
protobuf dependency.
