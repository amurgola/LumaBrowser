# Single-page apps, loading states and verifying that something happened

## The URL is not the whole story

- Many sites (web apps, dashboards, social feeds, shops) change the view
  without a full navigation. A click result saying "URL did not change" is
  not a failure by itself. Check the page: observe_page (new refs, new
  labels) or get_source (new content) tells you whether the view changed.
- Hash routes (#/settings) and query changes (?tab=reviews) do count as
  URL changes and are reported as such.

## Waiting for content

- After a click or submit, content may arrive a moment later. `wait_for`
  with a CSS selector waits for an element to exist (default timeout a few
  seconds). Use generic selectors from what observe_page showed, or common
  ones: `main`, `article`, `[role=dialog]`, `.results`, `table`.
- If no selector is known, simply observe_page again; it reads the live
  DOM at call time.
- Do not stack waits. One wait, one check, then act or report.

## Loading indicators

- Spinners, skeleton boxes, "Loading…" text in get_source mean the page is
  still fetching. Wait once, then read again.
- A button that stays disabled after a click may be waiting on a request;
  observe again after a short wait before assuming it failed.

## Tabs, accordions and expandable sections inside a page

- In-page tabs ("Overview", "Specs", "Reviews") are buttons or links whose
  click swaps content without navigation. Click by ref, then read.
- "Read more" / "Show more" / "Expand" reveals hidden text in place.
- Accordions (FAQ) open one item per click; the answer text appears in the
  source only after opening.

## Verifying an action

- Typing: the type result reports the field value and whether Enter was
  handled. A search should either navigate or re-render results.
- Clicking a toggle (like, follow, add to cart, save): look for the changed
  label ("Liked", "Following", "Added", a count that went up) or a toast
  message ("Added to cart") in get_source right after.
- Form submission: a success message, a new URL, or the form disappearing.
  Otherwise look for validation errors near the fields.

## Things that reset refs

- Any navigation, a full re-render (sorting, filtering), opening a modal.
  When in doubt, observe_page again; it is cheap and it prevents acting on
  a stale number.

## Frames and embedded content

- Content inside third-party iframes (payment forms, embedded videos, some
  comment systems) is not listed by observe_page and not in get_source.
  Say that the element is inside an embedded frame this assistant cannot
  reach.

## The page reloaded or navigated away unexpectedly

- Re-read the current URL from the last tool result and continue from the
  page that is actually showing. Tell the user if it is not where they
  expected to be.
