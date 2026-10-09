# ArtifactViewUrl

`core/network-sharing/webapp/public/js/shim/ArtifactViewUrl.js`

`ArtifactViewUrl.of(id)`: `/sharing/artifacts/<id>/view`, the web-reachable
view of a host artifact. The host reports its own `127.0.0.1` URL, which a remote
device cannot open; this route authenticates with the pairing cookie, so preview
iframes load.
