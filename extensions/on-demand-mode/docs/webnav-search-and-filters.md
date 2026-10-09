# Site search, filters and sorting

## Using a site's search box

- The search field is usually an `input` labelled "Search", "Search…",
  with a magnifier button beside it. observe_page, then `type` with the
  query and `submit: true`. One call.
- Header searches on some sites are hidden behind a magnifier icon button:
  click it, observe_page, then type into the revealed field.
- If the result says the URL did not change, the site may filter in place
  (SPA) or the field needed its own button. observe_page: results may
  already be listed; otherwise click "Search" / "Go".

## Reading results

- get_source markdown after the search; results are headings or links with
  snippets. Report the top few titles, not the whole list, unless asked.
- To open a result: observe_page and click the result title by ref. Prefer
  the first organic result over "Sponsored" or "Ad".

## Filters and facets (shops, listings, catalogs)

- Filters live in a sidebar (desktop) or behind a "Filter" button (narrow
  layouts). observe_page lists them as checkboxes, links or buttons:
  "Size", "Color", "Brand", "Price", "In stock".
- Click one facet at a time and check that the results changed (count text
  such as "128 results" or the URL gaining ?color=blue).
- Price ranges: two inputs (min, max) plus "Apply"/"Go"; use fill_form then
  click Apply. Sliders cannot be dragged from here; use the inputs.
- "Clear all" / "Reset filters" undoes everything.

## Sorting

- A `select` labelled "Sort by" or a "Sort" button opening a list.
  Options: Relevance, Newest, Price low to high, Price high to low, Rating,
  Popular. Match the user's words: "cheapest first" is price low to high,
  "latest" or "most recent" is newest, "best rated" is rating.
- Sorting usually reloads or re-renders: observe_page again before the
  next click.

## Search within a page

- "Find the word X on this page": get_source markdown and look for it;
  report the sentence around it and roughly where it is (near the top,
  under the heading Y). There is no find-in-page tool.

## Advanced search and operators

- Quoted phrases and minus-words work on most site searches and on web
  search engines. Use them only when the user's plain query failed.

## Search returned nothing

- Check for typos from speech (homophones, dropped plurals) and retry with
  the corrected term once. Then report the empty result plainly.
