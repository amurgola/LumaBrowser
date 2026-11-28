# PeerImageServers

`core/network-sharing/client/PeerImageServers.js`

Registers a peer's shared image and video slots as remote image servers on
the image server service.

## Methods

- `new PeerImageServers(imageServerService, peerStore)`; both methods are no-ops
  without a service (register also needs `upsertRemoteServer`).
- `PeerImageServers.serverId(peerId, role)` is `peer:<peerId>:<role>`, role
  `image-generate`, `image-edit` or `image-video`.
- `register(peer)`:
  1. snapshots existing remote servers and the active server id per role;
  2. `removeServersForPeer(peer.id)`;
  3. upserts one server per available slot (`manifest.image.generate`, `.edit`,
     `.video`): `{ id, name: '<name> · Image Generation|Image Editor|Video
     Generation (shared)', kind ('generate' | 'edit' | 'video'), endpoint:
     '<endpoint>/sharing/image' (image slots) or '<endpoint>/sharing/video'
     (the video slot), token, peerId, peerManaged: true, models, modelLabel,
     selectedModel }`.
     `models` is the host's list (`label` defaults to `id`) or `null`;
     `selectedModel` is the previous pick if the host still offers it, else `null` (host default);
  4. restores an active selection that pointed at a slot still offered;
  5. on the first registration only (`peer._imageServersAdopted` unset), makes
     each offered slot active for a role this machine cannot serve itself, and
     marks the peer adopted in the store. A role can be served locally when
     `isEnabled()` is true and `computeLocalServerEntry(role).available` is true
     (the role has a local default model,
     [ImageServerSelection](../../image-server/service/ImageServerSelection.md)`.localEntry`);
     such a role keeps its local slot and the peer's server is only listed. A
     service without either function (older test fakes) counts as not able to
     serve locally, so every offered slot is adopted as before.
- `unregister(peerId)` calls `removeServersForPeer(peerId)`.

## Why

`removeServersForPeer` reverts active ids to local, which is right for an
un-pair but silently flipped the user's remote choice back to local every time
the host's manifest changed. Bringing a peer's image servers in is the act of
choosing them, so they are adopted once; a later re-register must not stomp a
selection the user has since changed. A slot the host stopped offering stays
reverted so generation never targets a server that is gone.

## Changes (2026-11-27, pairing no longer takes over a working local slot)

Pairing used to make every offered peer slot active. On 2026-11-26 that made a
peer's Image Generation the active generator on a machine with its own image
models and a local default, so every generation (including game assets pinned
to a local model) went to the peer. Adoption now skips the roles the local
slot can serve; the peer's servers are still registered and can be picked by
hand, and a hand-picked peer server is kept across re-registers as before.
