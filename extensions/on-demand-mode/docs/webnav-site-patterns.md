# Common site layouts and where things live

Knowing the usual layout turns a vague command into the right ref quickly.

## News and magazine sites

- Header: logo (home), section links (News, Sport, Business, Opinion,
  Culture), a search icon, Sign in / Subscribe. Sections are links; "the
  news button" is the News link.
- Home page: a lead story, then grids of headlines. "The first headline" is
  the lead story link; "the second article" is the next headline link.
- Article page: title, byline, body, related links, then comments (often
  behind "Show comments"). Paywall text appears after a few paragraphs on
  subscription sites.
- Common overlays: cookie consent, newsletter, "subscribe to continue".

## Online shops

- Header: search box (prominent), account, cart/basket, category menu.
- Category and search results: product grid, filter sidebar, sort select,
  pagination or "Load more".
- Product page: title, price, variant selectors (size, colour), quantity,
  "Add to cart"/"Add to bag", tabs (Description, Specifications, Reviews).
- Cart page: quantities, remove, "Checkout" (the confirmed step).

## Documentation and knowledge sites

- Left sidebar: table of contents with expandable sections. Right side:
  "On this page" anchor list. Top: search (often opens with "/" or Ctrl+K).
- Version selectors and language selectors near the top.
- Code blocks have "Copy" buttons; those copy to the clipboard, nothing
  visible changes.

## Social feeds and forums

- Infinite scroll feed; each post has like/upvote, comment, share.
  Posting or replying is a Send-class action: draft, then confirm.
- Profile pages: Follow / Subscribe buttons toggle; the label changes.
- Sort controls: Hot, New, Top, Latest, Recommended.

## Video sites

- Search at the top; results are thumbnails with title links.
- Watch page: player (not controllable from the DOM reliably), title,
  channel, Like, Subscribe, description with "...more", comments below.
  "Play" or "pause" commands: click the player area or press_key "k" or
  "Space" with the player ref; results vary by site.

## Webmail and messaging

- Left: folders (Inbox, Sent, Drafts). Centre: message list. Right or full:
  the open message. "Compose"/"New message" opens a form: To, Subject,
  body, Send (confirmed step).
- Selecting messages uses checkboxes; bulk actions appear in a toolbar.

## Web apps and dashboards

- Navigation rail on the left, content area, a top bar with search and the
  account menu. Views change without navigation; verify by content.
- Settings usually behind the account/avatar menu, top right.

## Search engines

- Query box, results list (title links with snippets), filter tabs (All,
  Images, News, Videos), "Next" at the bottom. Sponsored results come first
  and are labelled.

## Government, banking, forms-heavy sites

- Multi-step wizards with Next/Back; progress indicator at the top. Every
  step may validate. Payment and submission steps are confirmed actions.

## Mobile-style layouts on narrow windows

- The navigation collapses into a "Menu" (hamburger) button; sections are
  inside it. Filters hide behind a "Filter" button. Open, observe, then act.
