# ShareLinks

`core/llm-server/ui/js/chat/common/ShareLinks.js`

Share-as-link through the Network Sharing web backend. Only the desktop API has
`share`; on the web shim every share affordance stays hidden.

## Methods

- `refreshStatus(force?)`: resolves whether the backend runs (cached 4 s), sets
  `state.shareAvail` and toggles the root's `cm-share-on` class.
- `copyLink(kind, targetId, title)`: mints or reuses the public link and copies
  it; resolves the URL only when the clipboard write succeeded, else `null`.
- `ShareLinks.flash(btn, url)`: check or cross for 1.4 s, then the link icon.
