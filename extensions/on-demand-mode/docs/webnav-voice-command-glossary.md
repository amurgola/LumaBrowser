# Spoken commands and the actions they map to

Commands arrive from speech: short, casual, sometimes mis-heard. This
table is the default reading. When the words could mean two things, pick
the reading that matches something visible on the page.

## Navigation and sections

| Said | Do |
|---|---|
| "click the news button", "go to news", "open news", "news" | observe_page, click the ref labelled News (header link first) |
| "go home", "home page", "back to the start" | click the logo/Home link, or navigate to the site root |
| "go back", "previous page" | navigate to the previous URL from earlier tool results |
| "open the menu", "show the menu", "hamburger" | click Menu / the icon-only button top right or left |
| "open X in a new tab" | say that this panel works on the current tab only, then offer to open it here |
| "refresh", "reload" | navigate to the current URL |
| "go to example dot com" | navigate to https://example.com (speech spells dots as "dot") |
| "search for example dot com", "search for textbookly" (a site name) | the user wants the SITE: navigate to it directly, even from a search engine page |
| "search for cheap textbooks" (a phrase) | on a page with a search box: type it with submit; on a search engine: type into its box; elsewhere: navigate to a search engine query |
| after any navigation | one short line: where you are now. No page description unless asked |

## Scrolling

| Said | Do |
|---|---|
| "scroll down", "go down", "further down" | scroll down 600 |
| "scroll down a bit", "a little" | scroll down 300 |
| "scroll a lot", "way down", "keep going" | scroll down 1500 |
| "scroll up" | scroll up 600 |
| "top", "back to the top" | scroll top |
| "bottom", "all the way down", "to the end" | scroll bottom |
| "next page" (no pagination on screen) | scroll down 800 |
| "scroll to the comments / reviews / footer" | scroll toward it in 800 steps, checking refs, or click an in-page anchor |

## Reading and questions

| Said | Do |
|---|---|
| "what is this page", "what's this about", "where am I" | get_source markdown; two-sentence answer |
| "read the headline", "what's the title" | get_source markdown; the first heading |
| "read me the article", "summarize" | get_source markdown; three to five sentences |
| "what does it say about X", "how much is it", "when is it" | get_source markdown; the exact figure or sentence |
| "are there any comments" | scroll toward comments or read the source; report count/presence |
| "read the first three headlines" | get_source markdown; first three headings |

## Searching and typing

| Said | Do |
|---|---|
| "search for X", "look up X", "find X" | type X into the search field with submit true |
| "type X", "enter X", "put X in the box" | type X into the most relevant field (focused or the only input); no submit |
| "press enter", "submit", "go" | press_key Enter with the ref of the field just typed into |
| "clear the search", "clear that" | type an empty string into the field (clear true) |
| "select X" (dropdown) | type the option text into the select, or click it then click the option |
| "check the box", "tick X" | click the checkbox ref |

## Overlays

| Said | Do |
|---|---|
| "close that", "dismiss", "get rid of the popup" | click Close / No thanks / X; else press_key Escape |
| "accept the cookies", "accept all" | click Accept all |
| "reject the cookies" | click Reject all / Only necessary |

## Actions with consequences

| Said | Do |
|---|---|
| "add to cart", "add to basket" | click Add to cart; report the toast or count |
| "buy it", "check out", "place the order" | proceed to checkout; STOP before Pay / Place order and ask |
| "get me to the purchase page, I'll take it from there" | click the buy / view offer link for the chosen item; if it opens in a new tab, say so; do not fill checkout fields |
| "send it", "post it", "reply" | fill the field; ask before pressing Send |
| "delete it", "cancel my order" | identify the exact item; ask before the destructive click |
| "log in", "sign in" | open the form; fill only dictated details; ask before submitting |

## Panel control (no page action)

| Said | Do |
|---|---|
| "never mind", "stop", "cancel that" | stop; reply "Okay." |
| "thanks", "that's all" | reply briefly, no action |
| "what can you do" | one sentence: click, type, scroll, search and read on this page |

## Speech artefacts to normalise

- Homophones: "knews" news, "sight" site, "cite" site, "buy" by, "too" to.
- Dropped or doubled words: "click the the news" is "click the news".
- Filler: "um", "like", "please", "can you", "could you", "for me" carry no
  meaning; the command is the verb and the target.
- Spelled URLs: "w w w dot", "slash", "dash", "underscore" become the
  characters. "dot com" is ".com".
