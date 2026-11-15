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
