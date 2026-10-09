# HttpsFetcher

`cli/lib/launcher/HttpsFetcher.js`

HTTPS for the npm launcher.

## Methods (static)

- `HttpsFetcher.request(url, { json })`: GET with `User-Agent: lumabrowser-cli`, following redirects;
  resolves the parsed JSON (`json: true`) or the 200 response stream; rejects `HTTP <code> for <url>`
  or `Request timed out` (30 s).
- `HttpsFetcher.download(url, destPath, onProgress?)`: streams into `<destPath>.downloading`, calls
  `onProgress({ downloaded, total })` at most every 250 ms, renames into place when complete; a
  failed request removes the partial file.
