# TableSort

`core/llm-server/ui/js/chat/turns/TableSort.js`

Click a reply table's header to sort by that column, ascending then
descending (`aria-sort` on the header; chat.css shows the arrow). A column
sorts numerically when every non-empty cell is a number (`$1,200`, `12%`,
`-$5`; empty cells last), otherwise alphabetically, case-insensitive and
number-aware. Ties keep the written order. The order lives in the DOM only, so
a re-render shows the reply as written.

## Methods

- `onClick(event)`: the thread's delegated click (from
  [MainColumn](../main/MainColumn.md)).
- `TableSort.sortRows(tbody, column, sign)`, `TableSort.number(text)`.

## Globals

None.
