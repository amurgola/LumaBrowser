# ArtifactDownloader

`core/llm-server/ui/js/chat/panel/ArtifactDownloader.js`

Downloads the artifact open in the panel: media as a typed blob with an
extension from its mime (using the bytes the panel holds, else a fetch),
anything else as UTF-8 text with an extension from its type or code language.
Names are made file-safe and capped at 60 characters.

## Methods

- `ArtifactDownloader.download(api, panelState)`: nothing for an unsaved panel.
- `extFromMime(mime)`, `extForArtifact(artifact)`, `safeName(title, fallback)`,
  `base64ToBlob(b64, mime)`.
