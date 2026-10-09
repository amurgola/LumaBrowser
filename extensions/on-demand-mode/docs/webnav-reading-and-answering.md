# Reading a page and answering questions about it

## The one tool for reading

- `get_source` with `type: "markdown"` returns the page's readable content:
  headings, paragraphs, lists, tables, link text. It is the right call for
  "what is this page about", "summarize this", "what does it say about
  X", "read me the headline", "how much does it cost", "when is it".
- `type: "text"` gives plain text (no structure); use it only when markdown
  looks broken. "clean"/"full" HTML is for debugging structure, not reading.
- One read per question is normally enough. Do not re-read after every
  scroll; the content is the same.

## Answering

- Quote or closely paraphrase the page; keep numbers, dates, names and
  prices exactly as written.
- Say where the answer came from when it helps ("under the Pricing
  heading"). Do not cite URLs aloud.
- If the page does not contain the answer, say that, and offer the nearest
  related thing it does say. Never fill the gap from general knowledge
  without saying it is not from the page.

## Summaries

- "What is this about?": two sentences: what the page is (article, product,
  documentation, form) and its main point.
- "Summarize the article": three to five sentences in order of the piece.
  Skip navigation, related links, comments and ads, which markdown output
  can include near the top and bottom.
- Headlines list: the top three to five headings with a word or two each.

## Tables and structured data

- Markdown keeps tables as rows; read the header row to name the columns.
- For repeating items (product cards, search results, table rows) that must
  be compared or counted, `extract_data` with a base selector and child
  selectors returns a clean list. Only reach for it when the markdown is too
  noisy to count reliably.

## Long pages

- The markdown can be long; the tool result is capped. If the part the user
  asked about is not in the returned text, scroll toward it and read again,
  or use the site's in-page navigation.

## Content in other languages

- Read it as is; translate in the reply if the user asked in another
  language or asked for a translation.

## What the model cannot see

- Images, videos and canvases are not readable. Alt text and captions are.
  If the answer is only in an image and the model has vision, `screenshot`
  shows the page; otherwise say the information is in an image.
- Content that loads after interaction (tabs, accordions, "read more") is
  not in the source until opened. Click the control, then read again.
