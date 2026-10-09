# ImageGenerationRun

`core/shell/extensions/ImageGenerationRun.js`

One `generateImage` call in flight.

## Methods

- `new ImageGenerationRun({ router, lab, opts, resolve })`.
- `start()`:
  - with a Lab: `beforeImage(opts)`; a `frozen` result resolves at once (the
    model never runs, `afterImage` is not called); an `opts` result replaces the
    params;
  - no router (or no `generate`): resolves null;
  - otherwise calls `router.generate({ ...opts without callbacks, send })`.
    Events: `meta` stores the resolved params, `done` resolves the first image
    (`mime` defaults to `image/png`, null when there is none), `error` resolves
    null, `status`/`progress`/`preview` go to the caller's hooks (payload `{}`
    when empty; a throwing hook is ignored). A rejected `generate` resolves null.
  - It settles once; the Lab then gets `afterImage(result, metaParams)`.
