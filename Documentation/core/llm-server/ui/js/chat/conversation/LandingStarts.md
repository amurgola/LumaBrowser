# LandingStarts

`core/llm-server/ui/js/chat/conversation/LandingStarts.js`

Builds the chat landing's start cards from what the browser already knows, at
most six, in this order:

1. Up to two open web pages, most recently viewed first (`kind: 'tab'`; the
   page title, "Ask about <host>"). Internal pages (http on 127.0.0.1 or
   localhost, file and app URLs) are skipped.
2. The most recently updated top-level conversation (`kind: 'conversation'`;
   its title, "Pick up where you left off, 2 hours ago"). Delegated
   sub-conversations are skipped.
3. The guided setup starters from [PersonaSeeds](PersonaSeeds.md)
   (`kind: 'seed'`; label and description).

Pure: [LandingView](LandingView.md) fetches the inputs and renders the cards.

## Methods

- `LandingStarts.build({ tabs, conversations, seeds, now })`: the card list.
- `LandingStarts.webTabs(tabs)`, `LandingStarts.lastConversation(conversations)`.
- `LandingStarts.host(url)`: the hostname without `www.`.
- `LandingStarts.ago(iso, now)`: "just now", "5 minutes ago", "2 hours ago",
  "yesterday", "3 days ago", else "on Oct 3".
