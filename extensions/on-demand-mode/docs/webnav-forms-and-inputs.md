# Forms, inputs and typing

## Typing into a field

- `type` with a ref does the whole thing: focuses the field, replaces its
  value (clear defaults to true), types the text, and with `submit: true`
  presses Enter. For "search for X" this is one call.
- Use `fill_form` when several fields go together (name, email, message):
  pass an array of `{ ref, value }`. Then click the submit button by ref.
- To add to an existing value instead of replacing it, pass `clear: false`.

## Submitting

- Enter submits most single-field forms (search boxes, URL fields, login
  with one visible input). `type` with `submit: true` covers it and reports
  whether the page navigated.
- Multi-field forms usually need the real button: observe_page after
  filling, find "Submit", "Send", "Continue", "Next", "Apply", "Search",
  "Sign in", then click it.
- Some sites only enable the button after every required field is valid.
  A disabled button in observe_page means a field is still empty or wrong.

## Field types and what to do

- Text, email, number, tel: `type` works.
- Select (dropdown): observe_page lists it as a `select` with its options
  or current value. `type` the visible option text into it; for native
  selects, this chooses the option. If that fails, click the select and
  observe again: custom dropdowns render their options as clickable items.
- Checkbox and radio: click the ref. The result reports the new state when
  it can. Clicking the label text also toggles most of them.
- Textarea: `type` works; newlines are fine.
- Date pickers: try typing the date in the format the placeholder shows
  first (2026-03-14 or 03/14/2026). Only open the calendar widget when
  typing is rejected; then click month arrows and the day number by ref.
- File inputs cannot be filled from here. Say so.
- Password fields: only type what the user dictated in this conversation.
  Never guess, never reuse, never invent.

## Autocomplete and suggestion lists

- Typing into address, city or search fields often opens a suggestion list
  under the field. If the goal is a specific suggestion, type the first few
  characters, observe_page, then click the suggestion.
- If the goal is just to search, `submit: true` bypasses the list.

## Validation errors

- After submitting, if the URL did not change, get_source (markdown) and
  look for messages near the form: "required", "invalid email", "must be".
  Report the exact message and fix only what the message names.
- Sites sometimes clear the whole form on error. Refill from the values the
  user gave, not from memory of the page.

## Login forms

- A visible "Sign in" link usually opens the form. Fill only what the user
  provides. If a code, captcha or two-factor prompt appears, stop and tell
  the user; that step is theirs.
- Ask before submitting a login unless the user explicitly asked to log in
  and provided the details.

## Reading what a form currently holds

- observe_page shows current values for inputs. get_element with a selector
  gives one element's properties when a precise check is needed (rare).
