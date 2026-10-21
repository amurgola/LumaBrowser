# HubAuth

`core/shared/download/HubAuth.js`

The one source of the Hugging Face token for every transfer and Hub API call.

## Methods

- `HubAuth.token()` the trimmed value of `HF_TOKEN`, else `HUGGING_FACE_HUB_TOKEN`,
  else `null`. `HubAuth.hasToken()` is the boolean form.
- `HubAuth.isHubUrl(url)` true for `huggingface.co`, `hf.co` and their subdomains
  (`cdn-lfs.huggingface.co`, `cas-bridge.xethub.hf.co`); false for anything else
  or an unparsable string.
- `HubAuth.headersFor(url)` `{ Authorization: 'Bearer <token>' }` when a token is
  set and the URL is on the Hub; `{}` otherwise.
- `HubAuth.ENV_VARS`, `HubAuth.HUB_HOST`.

## Why

Before this, only `HfHubClient` read the token, so a gated repo listed fine and
then every actual file transfer went out anonymous and failed with a generic
"request failed". [ResumableDownload](ResumableDownload.md) now defaults its
request headers to `HubAuth.headersFor(url)`, which puts the token on the probe,
every Range chunk and the sequential stream, and only ever on Hub hosts: a model
URL on lumabyte.com or a mirror never sees it. [HfHubClient](../../llm-server/models/HfHubClient.md)
reads the same token for the API.
