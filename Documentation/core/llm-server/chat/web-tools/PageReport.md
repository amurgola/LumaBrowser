# PageReport

`core/llm-server/chat/web-tools/PageReport.js`

Presents a read page to the model as one bounded reply.

## Methods

- `PageReport.render(document, { part, partChars, find?, handle, fromCache?,
  preface? })` -> `{ success: true, url, part, parts, thin, viaBrowser | status,
  message }`, or a failure when `part` is past the last part.
  - Message: optional preface, headline (`<url> (HTTP 200 | rendered in a
    browser tab ...), read <date>[, reused from earlier in this task]:`), body,
    [PageNotes](PageNotes.md), footer.
  - Body without `find`: the [TextPager](TextPager.md) part. Footer on
    multi-part pages: `[Part n of N, characters a-b of T. Continue with
    {"url":"<handle>","part":n+1}, or add "find" to jump to a term.]`, or
    `[Part N of N: the end of the page.]`.
  - With `find`: [MatchExcerpts](MatchExcerpts.md), each headed
    `[in part k]`, as many as fit one part; `part` is `null`. A miss says so
    and shows the requested part.
  - `thin`: no find hit and the text is not prose.

## Why

Research on agent tools shows silent truncation makes models reason over a
partial page as if complete, and that agents often do not paginate unless told
exactly how. So every part states its position and total and gives the literal
next call (using the result number when one was used), and `find` excerpts
name their part so the model can open the surrounding text in full.
