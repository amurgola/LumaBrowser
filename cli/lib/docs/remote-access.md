# Remote access

The Local API is loopback only. To reach a LumaBrowser on another machine, that machine shares through Network Sharing: Settings, Network Sharing, "Share my LLM". The host sets a PIN; a client pairs once with the PIN and receives a bearer token that it uses from then on.

## Base URLs on the host

- TLS (preferred): `https://HOST:3443/sharing`
- Plain HTTP (discovery and older pairings): `http://HOST:3000/sharing` (the REST API port)

The TLS listener uses an app-managed self-signed certificate. Pin its fingerprint on first use; Settings, Network Sharing shows it. The web chat client, when enabled, serves on port 80 by default.

## Pairing

```sh
curl -k -X POST https://HOST:3443/sharing/pair \
  -H "Content-Type: application/json" -d '{"pin":"1234"}'
```

The answer is `{ "token": "...", "name": "<host name>" }`. Keep the token; the host can revoke it in Settings. Repeated wrong PINs are rate limited and answer 429 with `retryAfterMs`.

## Using the shared model

Every path under `/sharing` except `/info` and `/pair` wants `Authorization: Bearer TOKEN`.

| Path | Meaning |
| --- | --- |
| `GET /sharing/info` | Liveness and instance name, no token. |
| `GET /sharing/resources` | What the host shares right now. |
| `GET /sharing/llm/v1/models` | OpenAI-compatible model list. |
| `POST /sharing/llm/v1/chat/completions` | OpenAI-compatible chat, streaming supported. |
| `POST /sharing/llm/v1/responses` | OpenAI Responses API. |
| `POST /sharing/image/generate` | NDJSON image generation, when image sharing is on. |

So any OpenAI client works with base URL `https://HOST:3443/sharing/llm/v1` and the token as its API key. Thinking knobs are read exactly as on the Local API (see `luma docs local-api`).

| Response | Meaning |
| --- | --- |
| Connection refused | Sharing is off, the host is not running, or a firewall blocks the port. On Windows the installer adds the rule; Settings has an "Allow through firewall" button for portable builds. |
| 403 | The bind mode on the host does not allow your network (LAN only versus any). |
| 401 | Missing, revoked, or wrong token. Pair again. |
| 503 | Sharing is disabled on the host or no model is loaded there. |

## WSL

Inside WSL on Windows, `127.0.0.1` is the Linux distribution, not Windows. With WSL mirrored networking the Windows Local API at `http://127.0.0.1:8317/v1` works directly. Otherwise use the Windows host address from `ip route show default | awk '{print $3}'` and go through Network Sharing on that address.

## SSH tunnel

To use a remote Local API without Network Sharing, forward the loopback port:

```sh
ssh -N -L 8317:127.0.0.1:8317 user@host
```

Then `http://127.0.0.1:8317/v1` on your own machine is the remote model. The Local API must be enabled on the host.
