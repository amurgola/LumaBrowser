# ReadmeCheck

`tools/docs/readme-check/ReadmeCheck.js`

The checks behind `npm run readme:check`. The README is the front door for people who are not developers as well
as for those who are, and it drifted twice: it grew to more than three times the length of comparable projects'
READMEs, and it kept pointing at Settings pages and claims that had changed. These checks catch the mechanical half
of that:

- **Word budget.** Prose words only (code blocks, inline code, HTML tags and link targets do not count). Over the
  budget is a problem whose message says where detail belongs: `Documentation/features`.
- **Links and images.** Every relative markdown link, markdown image, `href` and `src` must point at a file that
  exists. Web and mail links are left alone.
- **Anchors.** `#heading` links need a heading with that GitHub slug, in this file or in the linked markdown file.
- **Alt text.** An `<img>` with no `alt` attribute is a problem; `alt=""` marks decoration and is fine.
- **Dashes.** No em or en dash, the repo-wide rule.

Pure: text in, `{ words, problems }` out. The file system is reached only through the injected `exists` and
`readText`.

## Methods

- `static run(text, { maxWords, baseDir, exists, readText })`: all checks; `maxWords` defaults to 1500.
- `static countWords(text)`, `links(text)`, `images(text)`, `anchors(text)`: the parts, usable alone.
