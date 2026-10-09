# Game patterns: multiplayer netcode (this project's room relay)

This app ships a WebSocket ROOM RELAY for games. It is a dumb pipe: every JSON
message a player sends is delivered to the other players in the room with a
`from` field added. There is no server-side game logic: authority and
reconciliation are the game's job (patterns below).

## Getting connected

The relay lives on the same server the game is served from. One room per game.

```js
// src/systems/net.js
window.G = window.G || {};
G.net = (function () {
  let ws = null;
  let self = null;                 // my playerId, from the welcome message
  const handlers = {};             // type → [fn]
  const on = (type, fn) => { (handlers[type] = handlers[type] || []).push(fn); };
  const fire = (m) => { (handlers[m.type] || []).forEach((fn) => { try { fn(m); } catch (e) {} }); };

  async function host() {
    // The game page URL is .../api/ext/game-mode/play/<room>/index.html:
    // the room id is that path segment.
    const room = location.pathname.split('/play/')[1].split('/')[0];
    const r = await fetch('/api/ext/game-mode/room/' + room, { method: 'POST' });
    const info = await r.json();           // { token, wsPath, wsUrls: [...] }
    connect('ws://' + location.host + info.wsPath);
    return info;   // show info.wsUrls[1..] (LAN addresses) to the other player
  }

  function join(wsUrl) { connect(wsUrl); }  // the URL the host shared

  function connect(url) {
    ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'welcome') self = m.playerId;
      fire(m);
    };
    ws.onclose = () => fire({ type: 'net-closed' });
  }

  function send(msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
  return { host, join, send, on, get id() { return self; } };
})();
```

Relay-provided events: `welcome {playerId, peers}`, `peer-joined {playerId}`,
`peer-left {playerId}`. Everything else is whatever the game sends, relayed
with `from` set to the sender's playerId. Messages over 64KB are dropped.

The HOST player calls `G.net.host()` (only works inside the app: it needs the
authorized room endpoint) and shows the returned LAN `wsUrls` (or a join code
built from one) on screen; the JOINING player runs the shared/exported copy of
the game and calls `G.net.join(thatUrl)`. Put a small "Host / Join" panel in
the menu scene (a text input for the join URL is enough).

## Authority: keep it host-authoritative

For 2-8 player action games the simple correct model:
- The HOST simulates the world (physics, spawns, scoring) exactly as in single
  player, and broadcasts a snapshot at 10-15 Hz:
  `G.net.send({ type: 'state', t: performance.now(), players: {...}, entities: [...] })`
- Each CLIENT sends only its INPUT (or its own position) at the same cadence:
  `G.net.send({ type: 'input', up: true, x: 132 })`
- Clients render the host's snapshots; the host applies client inputs to the
  simulation. Ties and collisions are decided in one place: no divergence.

Never simulate the same entity on two machines and hope they agree.

## Smoothness: interpolate, never teleport

Render remote entities ~100ms in the past, lerping between the two most recent
snapshots:

```js
// per remote entity, on each snapshot: keep prev + next {t, x, y}
// in update(): const a = (renderTime - prev.t) / (next.t - prev.t);
sprite.x = Phaser.Math.Linear(prev.x, next.x, Phaser.Math.Clamp(a, 0, 1));
```

For the local player, apply input immediately (prediction) and let the next
host snapshot correct drift with a gentle lerp: snapping feels broken.

## Practical rules

- Send SMALL messages: numbers, short ids. Never send whole scene state per
  entity per frame; 10-15 Hz snapshots of the few live entities is plenty.
- Handle `peer-left` visibly (freeze/remove their avatar, show a toast).
- The game must remain fully playable single-player when `G.net` never
  connects: multiplayer is additive, behind the menu's Host/Join panel.
- Pause is per-client; don't try to pause the host simulation for everyone
  unless the design calls for it.
- Test locally: open the game in the Play overlay AND the popped-out tab:
  two sockets, one machine.
