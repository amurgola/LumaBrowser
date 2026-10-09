# ClipboardAttach

`core/llm-server/ui/js/chat/composer/ClipboardAttach.js`

Paste to attach: files and screenshots pasted into a composer are staged as
chips, exactly like a drop. A screenshot has no path on disk, so images are
read in the page with `FileReader` (capped at 8 MB, the desktop reader's cap,
over which the chip fails with the reason); other files go through
`api.readDroppedAttachments`. A paste that also carries plain text (an image
copied out of a document) is left as a normal text paste.

## Methods

- `onPaste(event)`: the composer textarea's paste listener. Returns the staging
  promise, or null when the paste was left alone.
- `ClipboardAttach.nameFor(file, now)`: a copied file keeps its name; a bare
  clipboard bitmap (Chromium names them `image.png`) becomes
  `Pasted image HH.MM.SS.png`.

## Globals

None.
