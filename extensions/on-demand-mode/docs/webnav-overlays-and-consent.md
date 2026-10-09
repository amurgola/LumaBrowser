# Overlays, consent banners, popups and paywalls

Overlays are the most common reason an action "did nothing": the click hit
a cookie banner, a newsletter modal or a chat widget instead of the page.

## Recognising an overlay

- observe_page shows buttons like "Accept all", "Accept cookies", "Reject
  all", "Manage preferences", "Got it", "I agree", "No thanks", "Close",
  "Maybe later", "Continue reading", "Subscribe", "Sign up for updates".
- A click result that says the target was covered or occluded.
- get_source markdown that starts with consent or subscription text before
  the real content.

## Cookie and consent banners

- Dismiss with the least-committal option that unblocks the page. Prefer
  "Reject all" or "Only necessary" when present; otherwise "Accept" is fine
  for a browsing session. Do not open "Manage preferences" unless asked.
- After dismissing, refs shift: observe_page again before continuing.
- Some banners sit at the bottom and do not block the page. If the user's
  action works without dismissing, leave the banner alone.

## Modals and popups

- Newsletter, discount, app-install and survey modals: look for "Close",
  "X", "No thanks", "Not now", "Maybe later", "Continue without". Escape
  via press_key "Escape" closes many of them when no button is listed.
- Clicking outside the modal (on the dimmed backdrop) also closes some.
  There is no direct tool for that; prefer the close control.
- Chat widgets (bottom-right bubble) do not block the page; ignore them.

## Age gates and region gates

- "Are you over 18?" / "Choose your country": pick the option that matches
  what the user is trying to do; when it is a factual claim about the user
  (age), ask rather than assume.

## Paywalls and login walls

- "Subscribe to continue", "Create a free account to read": the content is
  gated. Do not try to bypass it. Read what is available (the first
  paragraphs are often visible in get_source markdown) and tell the user
  the rest is behind a subscription or login.
- Do not sign the user up or log them in unless asked.

## Notification and location permission prompts

- These are browser-level prompts, not page elements; they cannot be
  clicked from here. The page usually works without answering them.

## Anti-bot challenges

- "Verify you are human", CAPTCHA, "Checking your browser": stop and tell
  the user. Do not attempt to solve them and do not retry in a loop.

## After the overlay is gone

- Retry the original action with fresh refs.
- If the same overlay returns on every page (some consent managers reopen
  until a choice is saved), choose Reject/Accept once explicitly and say so.
