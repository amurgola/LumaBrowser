# NavigationReply

`core/browser/tab-manager/NavigationReply.js`

The reply of an input action that may have navigated the tab.

## Methods

- `NavigationReply.build(data, preUrl, postUrl)` -> `{ success: true, data, urlChanged: true, newUrl }` when the URLs differ, else `{ success: true, data }`.
