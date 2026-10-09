# PlainTab

`core/browser/controller/PlainTab.js`

Turns a tab from the tab manager into a plain JSON object.

## Methods

- `PlainTab.from(tab)`: `tab.toJSON()` when the tab has one (model tabs), else the tab itself (the tab
  view manager answers plain objects).
