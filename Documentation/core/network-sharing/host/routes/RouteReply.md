# RouteReply

`core/network-sharing/host/routes/RouteReply.js`

Sends the `{ status, body }` replies the sharing services return, so the route
classes stay pure routing.

## Methods

- `RouteReply.send(res, reply)`: 204 ends with no body; anything else is
  `res.status(status || 200).json(body)`.
