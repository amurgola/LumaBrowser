# NavigationStamp

`core/browser/controller/NavigationStamp.js`

Stamps a browser action reply with the navigation it caused.

## Methods

- `NavigationStamp.apply(data, result)` mutates and returns `data`. When `result.urlChanged`, sets
  `urlChanged: true` and `newUrl`. Otherwise `data` is untouched.

Used by both REST and MCP surfaces, so every action reply reports a navigation the same way.
