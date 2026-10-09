# BrowserRoutes

`core/browser/BrowserRoutes.js`

REST controller for `/api/browser`, derived from the [BrowserActions](BrowserActions.md) table.

## Methods

- `BrowserRoutes.create(browserController)` returns an express router with one
  route per `BrowserActions.restRoutes()` entry, each calling
  `browserController[handler](req, res)`. Throws at mount time, naming the
  handler, method and path, when the controller lacks a handler.

A new action with a `rest` entry is routed without touching this file.
