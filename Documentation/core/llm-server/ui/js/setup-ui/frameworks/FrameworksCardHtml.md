# FrameworksCardHtml

`core/llm-server/ui/js/setup-ui/frameworks/FrameworksCardHtml.js`

The Frameworks card body (`#runtimesBody`), top to bottom: the format defaults, one [frame](FrameworkFrameHtml.md) per installed framework, and the Catalogue.

## Methods

- `FrameworksCardHtml.body(view, frameworks, context)`: `view` is the runtimes view, `frameworks` the [FrameworkStore](FrameworkStore.md), `context` `{ rows, prefs, npuNames, advice }`. With nothing installed the frames are one empty line ("No framework installed yet. Pick one from the catalogue below.") and the Catalogue opens by default.
- `groups(runtimes)`: the inference rows grouped by `row.framework` (else the row id), in the order each first appears: `[{ id, name, rows }]`. A framework is installed when any of its rows is.
- `pillText(view)`: "2 of 5 installed", installed frameworks out of all on this host.
- `formatRows(frameworks, rows)`: one row per format with `needsChoice` ("GGUF models run on", a select over its installed frameworks with `data-format-framework="<format>"`, the current one being `defaultFrameworkId`); nothing when no format needs a choice.
- `catalogue(groups, view, frameworks, advice, openByDefault)`: the `llm.runtimeCatalogue` fold ("3 frameworks") with a plain heading per framework that has no installed build (`data-catalogue-framework`, its name and what it loads) and its rows by advice; then `sourceCallout(view)`. With no such framework only the callout is drawn.
- `sourceCallout(view)`: "Where these come from", moved from RuntimesCard.

## Why

The model decides the framework, so the card is about frameworks and their one active build each; everything that is not installed is out of the way in one fold.
