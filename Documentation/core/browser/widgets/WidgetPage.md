# WidgetPage

`core/browser/widgets/WidgetPage.js`

Runs one widget page script in a tab.

## Methods

- `WidgetPage.run(wc, script)`: `wc.executeJavaScript(script, false)`; an empty answer (the page
  navigated mid-step) becomes `{ success: false, error: NO_RESULT_ERROR }`.
