# RepeatClicker

`core/browser/tab-manager/RepeatClicker.js`

click_until: clicks one link or button over and over until the page reaches a state the caller named, without a
model step per click. The target is found again by its label before every click
([RepeatClickScripts](RepeatClickScripts.md)), so it does not matter that the page redraws and refs go stale, and the
click itself is [ElementClicker](ElementClicker.md)'s real mouse click on the node the probe just tagged.

## Methods

- `RepeatClicker.run(page, options, deps)` -> `{ success: true, data }` or `{ success: false, error }`.
  - `options`: `text` (the visible label) and/or `selector` for the target; at least one of `untilText`,
    `untilSelector`, `untilUrl`; `intervalSeconds` (default 3, at least 1); `timeoutSeconds` (default 300, at most
    3600).
  - `deps`: `shouldStop()` (true once the caller's run was stopped), and the test seams `sleep(ms)` and `now()`.
  - `data`: `{ outcome, reached, matched ('text' | 'selector' | 'url' | null), clicks, reloads, seconds, url, note }`.
- `RepeatClicker.alertFor(data)` -> `{ title, body }` for an end the user should come and look at (`reached`,
  `navigated`, `target_gone`), else null. [TabManager](../TabManager.md) hands it to
  [TabAttention](../TabAttention.md) when the call asked for `alert`.

## Before the first click

The loop refuses to start, with a message the model can act on, when:

- no target or no stop condition was given (`TARGET_REQUIRED`, `UNTIL_REQUIRED`);
- the stop condition already holds (`ALREADY_TRUE`): a heading that is on the page in every state cannot tell the
  wanted state from the current one;
- no visible element matches the target (`NO_TARGET`): a wrong label is said after `START_WAIT_MS` (5 s) instead
  of after the timeout. The wait is for a page caught in the middle of an update, the spinner the last click set
  off, which shows the target again a moment later.

## The loop

Every `POLL_MS` (500 ms) the page is probed once:

1. a stop condition holds: `reached`;
2. the target is there: it is clicked, unless the last click was less than the interval ago;
3. the target has been away for `STUCK_MS` (15 s, a spinner that never ends): the address the loop started on is
   loaded again. It is a fresh load, never a reload, which would send a submitted form again. After
   `MAX_RELOADS_IN_A_ROW` (3) loads without the target coming back the loop ends as `target_gone`.

A tab whose address moved to another page (origin and path; a new query on the same page does not count) is given time
to finish loading, then probed: the stop condition showing there is `reached`, a tab back on the starting page goes
on, anything else ends as `navigated`.

`timeout` ends the loop with a note to call again with the same arguments, and `stopped` when `shouldStop()` turned
true. A page that cannot answer a probe in the middle of a navigation reads as "nothing here yet".

## Why

A local model asked to "keep clicking until the next step opens" looped click and observe_page itself: it clicked a
stale ref that had become "Back to cart", could not see the state it was waiting for in the element list, and
reported success on a page that was stuck on a spinner. The loop belongs in the harness.
