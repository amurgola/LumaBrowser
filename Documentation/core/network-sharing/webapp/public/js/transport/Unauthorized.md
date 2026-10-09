# Unauthorized

`core/network-sharing/webapp/public/js/transport/Unauthorized.js`

The error a `/sharing` call throws on a 401 (`unauthorized: true`, message
`Pairing required` by default). Constructing one dispatches `luma-unauthorized`
on the window, which [PairingGate](../web/PairingGate.md) answers by clearing the
token and showing the PIN card.

## Methods

- `new Unauthorized(message?, win = window)`; `Unauthorized.EVENT` is
  `'luma-unauthorized'`.

## Globals

Dispatches on `window`.
