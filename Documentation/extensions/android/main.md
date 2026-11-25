# main

`extensions/android/main.js`

Main entry of the Android add-on, loaded by name from the manifest. The work lives in
[AndroidExtension](AndroidExtension.md).

## Exports

- `activate(context)`, `deactivate()`: passed to the one AndroidExtension instance.
- `getExtension()`: how `mcp-tools.js` reaches that instance through the require cache.
