# ManifestSignature

`core/network-sharing/client/ManifestSignature.js`

A stable string signature of the resource-bearing parts of a host manifest.

## Methods

- `ManifestSignature.of(manifest)` returns `''` for no manifest. Covers LLM
  refs and labels, LLM context windows, each image slot's availability, label
  and installed model ids, and advertised GPUs (`index:name:vramTotalMB`).

## Why

The poll re-registers a peer only when its signature changes; otherwise it
would rewrite the provider configs every 15 seconds. `current` flags (the host
switching its own default) and GPU `busy` (flips on every lend) are left out on
purpose so they do not churn re-registration.
