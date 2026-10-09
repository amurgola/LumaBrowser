# entry (share viewer)

`core/network-sharing/webapp/public/js/share/entry.js`

The shared conversation page's module entry (`<script type="module" src="/js/share/entry.js">`
in `share-view.html`): `new ShareView({ win: window, doc: document }).start()`.
The conversation export bundles this module graph into one classic script. See
[ShareView](ShareView.md).
