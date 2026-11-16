# Sharing

## Network Sharing

Share your models, image, video and voice generation, agents and (opt-in) GPUs
with your other devices.

- PIN pairing, mDNS discovery and pinned TLS.
- A paired LumaBrowser can chat on this computer's models and render images
  and video clips on its image and video models. The host keeps nothing.
- A host's helper model is listed too, so a client can use it for bookkeeping
  while its main model runs elsewhere.

## Web app

An optional web app (PWA) for phones and tablets on your network.

## Tab Share

Share a live tab by link. Viewers can watch or take control. A window tab is
an ordinary tab, so a desktop window can be shared the same way.

With an interact link a visitor can press **Fit to my window** to size the tab
to their own window, so a site opened from a phone lays out for the phone.
Nothing is resized until someone presses it, and one visitor holds the size at
a time (the last to press it), which matters when several people share one tab.
Only the page is resized, never the LumaBrowser window, and it goes back when
that visitor presses Fit again or leaves. The page can shrink to a smaller
screen but does not grow past your own tab area. For a window tab the app's
window is resized to fit and put back afterwards.

## Security

Keep the API, WebDriver and CDP ports on localhost (the default) unless you
mean to share them, and set an API key in **Settings > API & MCP** before you
expose the REST API beyond localhost.

- Without an API key, the REST API answers local programs and LumaBrowser's own
  pages only. A web page on any other origin, another port on this computer
  included, needs a key, and so does anything that reaches the API through a
  reverse proxy or tunnel.
- WebDriver and CDP need an API key as soon as they listen on anything but
  localhost.
- A device paired through Network Sharing gets the built-in chat tools
  (browsing, artifacts, images, video, music, web search, your knowledge base).
  Extension tools, connected MCP servers and outbound webhooks are off for
  shared chats until you tick them under **Settings > Sharing**, and a tool you
  switched off for your own chat is never shared. The terminal is never shared.
- An agent working for a paired device can browse the web and other machines on
  your network, but not this computer itself: no local files, no LumaBrowser
  internal pages, and nothing on this computer's own addresses.
- New pairing PINs are 6 to 8 digits, and repeated wrong PINs lock pairing for
  everyone for a while.
