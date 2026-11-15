# KeySequences

`core/terminal/host/KeySequences.js`

Turns key names (`enter`, `tab`, `escape`, `up`, `f5`, `ctrl+c`, `alt+b`, `shift+tab`) into the bytes a terminal sends
for them. Cursor keys, Home and End follow the application cursor mode full-screen programs switch on.

## Methods

- Static `encode(keys, { applicationCursor })` -> `{ data }`, or `{ error }` naming the first unknown key.
