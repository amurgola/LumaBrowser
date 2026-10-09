# AppAsarLocator

`tools/build/bytecode/AppAsarLocator.js`

Finds the packed archive in an electron-builder output folder:
`resources/app.asar` (Windows, Linux), `<ProductName>.app/Contents/Resources/app.asar`,
or any `*.app` bundle (macOS).

## Methods

- `AppAsarLocator.find(appOutDir, productName)`: the path, or null.
