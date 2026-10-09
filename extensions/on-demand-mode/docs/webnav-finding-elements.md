# Finding the element the user means

Spoken commands name things by what they look like or say, never by markup:
"the news button", "the blue sign-in thing", "that link about pricing".
The job is to map those words onto one element ref from `observe_page`.

## Always start from observe_page

- `observe_page` lists the page's interactive elements as numbered refs with
  their role and visible label: `[12] link "News"`, `[3] input "Search"`,
  `[7] button "Accept all"`. Refs are the only reliable handle. CSS selectors
  written from imagination fail on real pages.
- Refs die on navigation. After any click that changed the URL, or after a
  `navigate`, call `observe_page` again before the next action. A tool result
  that says the ref is stale means exactly this.
- The list is capped (main interactive elements first, then extras). If the
  element is not there, scroll toward where it should be and observe again.

## Matching words to labels

1. Exact label match wins: "click News" and a ref labelled "News".
2. Then a label that contains the words: "sign in" matches "Sign in to your
   account". Ignore case, punctuation and trailing counts ("Inbox (4)").
3. Then synonyms the web uses interchangeably:
   - sign in / log in / login / account
   - sign up / register / create account / join
   - search / find / magnifier icon
   - menu / hamburger / navigation / more / three lines
   - cart / basket / bag
   - home / logo (the site logo is usually the home link)
   - news / headlines / latest / top stories
   - next / more / load more / see all / show more
   - close / dismiss / x / got it / no thanks
4. Then the element's role: "the search box" is an `input`, "the news
   button" may be a `link` in the header even though the user said button.
   Users do not distinguish links from buttons.
5. Speech errors are common: "knews" is news, "scrawl" is scroll, "clique"
   is click, "the login butt" is the login button. Prefer the closest page
   label over a literal reading.

## When several refs match

- Prefer elements in the primary navigation (header) for site sections,
  and elements inside the main content for article-level actions.
- Prefer the first visible match in reading order when the user said "the
  first" or gave no qualifier, and say which one was clicked.
- If two matches are genuinely different destinations (a "News" link in
  the header and a "News" tab inside a widget), pick the header and mention
  the other in the reply so the user can redirect with one word.

## Icon-only controls

- Icons often carry an accessible name (`aria-label`, `title`) that
  observe_page shows as the label: "Search", "Menu", "Close", "Account".
- If the label is empty, the ref still lists the role and any nearby text.
  A lone `button` at the top right of a page is almost always menu, search
  or account. Try it and read the result.

## Things that look clickable but are not in the list

- Cards and tiles: the clickable part is usually the title link inside the
  card. Click the link, not the card.
- Dropdown menus: the top-level item may only open a submenu on hover. Click
  it; if the URL does not change, observe again, the submenu items are now
  listed.
- Elements below the fold are listed but may need scrolling before a click
  lands. click already scrolls the target into view; if it reports the
  element was covered, dismiss the overlay (see the consent and overlays
  note) and try again.

## Verifying the click

The click result reports the method used and whether the URL changed. A
navigation link should change the URL; an in-page control (menu, tab,
accordion) should not. If the expected change did not happen, do not
repeat the same click blindly: observe_page, look for a better ref, and
explain what happened.
