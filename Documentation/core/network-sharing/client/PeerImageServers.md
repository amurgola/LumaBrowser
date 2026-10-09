# PeerImageServers

`core/network-sharing/client/PeerImageServers.js`

Registers a peer's shared image slots as remote image servers on the image
server service.

## Methods

- `new PeerImageServers(imageServerService, peerStore)`; both methods are no-ops
  without a service (register also needs `upsertRemoteServer`).
- `PeerImageServers.serverId(peerId, role)` is `peer:<peerId>:<role>`, role
  `image-generate` or `image-edit`.
- `register(peer)`:
  1. snapshots existing remote servers and the active server id per role;
  2. `removeServersForPeer(peer.id)`;
  3. upserts one server per available slot: `{ id, name: '<name> · Image
     Generation|Image Editor (shared)', kind, endpoint: '<endpoint>/sharing/image',
     token, peerId, peerManaged: true, models, modelLabel, selectedModel }`.
     `models` is the host's list (`label` defaults to `id`) or `null`;
     `selectedModel` is the previous pick if the host still offers it, else `null` (host default);
  4. restores an active selection that pointed at a slot still offered;
  5. on the first registration only (`peer._imageServersAdopted` unset), makes
     every offered slot active and marks the peer adopted in the store.
- `unregister(peerId)` calls `removeServersForPeer(peerId)`.

## Why

`removeServersForPeer` reverts active ids to local, which is right for an
un-pair but silently flipped the user's remote choice back to local every time
the host's manifest changed. Bringing a peer's image servers in is the act of
choosing them, so they are adopted once; a later re-register must not stomp a
selection the user has since changed. A slot the host stopped offering stays
reverted so generation never targets a server that is gone.
