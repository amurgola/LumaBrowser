# ApiResponse

`core/browser/models/ApiResponse.js`

The JSON envelope every browser REST route replies with.

## Methods

- `new ApiResponse(success = true, data = null, error = null, message = null)`
  stamps `timestamp` with the current ISO time.
- `ApiResponse.success(data = null, message = null)` builds a success envelope.
- `ApiResponse.error(error, message = null)` builds a failure envelope.
- `toJSON()` returns `{ success, timestamp }` plus `data`, `error` and
  `message` when they are not `null`, so `res.json(response)` and
  `JSON.stringify` omit empty fields. Falsy values such as `0` and `''` are kept.
