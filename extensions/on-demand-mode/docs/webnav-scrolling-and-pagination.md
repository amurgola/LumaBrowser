# Scrolling, pagination, infinite feeds and "more"

## Scroll amounts for spoken commands

- "scroll down" / "go down": `scroll` direction down, amount 600.
- "a bit" / "a little": 300. "a lot" / "way down": 1500.
- "scroll to the bottom" / "the end": direction bottom. "top" / "back up
  to the top": direction top.
- "next page" when there is no pagination control: the user means scroll a
  screen, about 800.
- Horizontal scrolling (carousels, wide tables): direction left/right, 400.

## Scrolling to something specific

- "scroll to the comments" / "the reviews" / "the footer": observe_page and
  click is not right for a heading. Instead: get_source (markdown) to
  confirm the section exists, then scroll down in steps of 800, checking
  observe_page for refs whose labels belong to that section (comment form,
  "Load more comments", review stars). Say what you reached.
- Many sites have in-page anchors ("Jump to reviews", "Comments (32)") in
  the header or near the title; clicking those is faster than scrolling.

## Infinite scroll

- Feeds (social, news lists, product grids) load more items as you scroll.
  Scroll down 1500, wait a moment (wait_for a known item selector or just
  observe_page again), and the new items appear as new refs.
- Do not scroll more than a few times for one command; report what loaded
  and ask whether to continue.

## Pagination controls

- Look for "Next", ">", "Older", "More results", page numbers, or "Load
  more" / "Show more" buttons. Click by ref.
- "Next" is usually at the bottom; scroll to bottom first, then observe.
- Page numbers change the URL (?page=2, /page/2). navigate directly when
  the pattern is obvious and the user asked for a specific page.
- "Load more" buttons append items in place: URL unchanged, refs grow.

## Back to where we were

- After a click that navigated, "go back" means the previous URL. The
  conversation remembers earlier URLs from tool results; navigate to the
  previous one. If unknown, say so instead of guessing.

## Scroll did nothing

- The page scrolls inside a container (a chat panel, a modal, a map).
  Clicking inside that region first gives it focus; then press_key
  "PageDown" with a ref inside it scrolls the container.
- The page is short: bottom and top are the same place. Say so.

## Long documents

- Reading is better than scrolling: get_source markdown returns the whole
  visible text at once. Use scrolling for the user's eyes, get_source for
  yours.
