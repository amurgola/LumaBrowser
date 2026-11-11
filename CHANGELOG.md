# Changelog

## 2.1.6

### Changes
- **Roleplay turns re-read far less with a local model.** The story so far, the cast cards, the up-close notes, who is off stage and the setting now go in the newest message, after the player's own text, rather than in the system prompt. The system prompt keeps only what holds from turn to turn: the brief, the premise and the cast's body notes. llama-server reuses a request only up to the first changed character, so a system prompt that changed every turn made it read the whole history again. A 32-turn run at an 8k window re-read 138,641 of 140,265 narrator prompt tokens; now only the new tail is read. A change of cast still re-reads the history once.
  - The story state opens with its own line, so the model reads it as the narrator's notes and not as something the player said. The player's text comes first: with the state ahead of it, Qwen3.8-27B's reasoning grew from 1,900 to 4,400 characters on average and one reply in twelve came back empty. With the state after the text it reasons about 2,450 characters and no replies came back empty.
  - **The history trim moves in steps.** It used to drop one exchange per turn once the budget was reached, which changed the first message, and so caused a full re-read, on every turn. It now holds the cut in place and moves it by a quarter of the budget at a time. The kept history is between about three quarters of the budget and all of it.
  - Chat modes can return a `turnPrompt`, written after the newest message's own text (capped at 64,000 characters), for context that changes every turn. `buildTurn` receives `capabilities` so a mode can tell whether the app places it. On an older app, the roleplay add-on keeps its story state in the system prompt as before.
- **Empty replies are asked for again on the plain chat path.** A reasoning model that wrote its whole answer inside its reasoning and stopped used to leave a blank bubble. The request is now re-sent (up to twice, unchanged, so nothing is re-read), as the Tools-on path already did. Stop, a newer turn and native tool calls are never retried.
- **Tool groups are picked from what the user typed.** The Tools-on path used to read the whole task, including a roleplay's story state and scene notes. A phrase such as "recent events" there loaded the web tools and their manual for nothing.
- **Roleplay Lab:** the context audit reports the story state separately from the system head.

## 2.1.5

### New features
- **Local models grouped by family (LLM > Setup, Chat defaults, the chat model picker):** every list of local models now uses the same tree. Models are grouped by family and size ("QWEN 3.8 [27B]"), with each version listed largest quant first and named by what sets it apart (a finetune, your rename, or the quant). A model you have in three quants used to show as three identical rows; each row now shows its quant (`UD-Q6_K_M` from the file name, not the header's coarser `Q6_K`). The family and size come from the file name, then from the GGUF header, so renamed or repacked files still land in the right group. Chat defaults uses one dropdown section per family and size, and the picker pill names the model in full ("Qwen 3.8 27B · UD-Q6_K_M").
- **Compaction is remembered across turns:** a summary written once a conversation outgrew its window is stored with the conversation. Later turns reuse it for the same leading messages, with no new model call and no full re-read. An edit, a regeneration or another branch invalidates it, and a run with a larger window than the summary was written for gets the full history again unless that is over the limit too. Before this, on a 16k window every turn past the limit failed its first request twice, ran a fresh summary and re-read 8,000 to 10,000 tokens.
- **Earlier tool calls are replayed in the history:** a past turn's tool calls (the call and a short result line, long payloads clipped and marked) are put back before its answer. Before, the model saw itself answering "Here is your image" with no call before it, and after a few turns it started announcing work without calling any tools.

### Changes
- **Tool manuals no longer go missing.** Whether a tool group's manual still needs sending is now worked out from the history being sent, not from a "delivered" flag set once. The message carrying a manual can drop out of the history (a regenerated or edited turn, compaction, a mode's history trim), which left the group active with no manual anywhere, so the model called its tools blind. A mid-run compaction now keeps any manual it would otherwise summarize away. Conversations that still hold the old flag ignore it.
- **Earlier user turns are no longer re-sent with that turn's one-off blocks.** Only the user's text and any manuals the turn delivered are replayed. The artifact catalog, a mode's post-history prompt (roleplay scene notes), the clock and the format reminder were repeated on every past turn, which added about 14,000 characters by turn eight with a 1,500-character post-history prompt.
- **Compaction on small windows keeps less, so it lasts.** The part kept after a compaction is now sized against the window left after the system prompt and tool schemas, and leaves a quarter of the window free below the trigger. With a large agent prompt on a 16k window, the old rule left the request just under the trigger, so the next tool result compacted again. A run could use all four compactions in a few steps and then fail with HTTP 400. Native tool schemas now count toward the trigger, and the agent checks for compaction before its first request as well, since a long conversation can fill the window already. 64k windows are unaffected.
- **A context overflow is no longer retried as a cold start.** The first request's warm-up retry used to wait 3 s and send the same oversized request again. It now goes straight to overflow recovery.
- A tool result shrunk by overflow recovery stays shrunk when the per-step reminder is written again.
- **The tool-call protocol stays the same when the server restarts.** A model's family (which decides native tool calls or the fenced format) is remembered from its last launch plan. Before, a renamed or repacked model could get one family from its file name on the turn that started the server and another from its plan afterwards, which changed the system prompt and re-read the whole conversation.
- **MiniMax-H3-Image renders at 4 MP or more.** Smaller requests render at 2048x2048 (the model's working range, as its official pipeline does) and are scaled back to the size you asked for. Reference edits render at least at 2304x2304, since edits at 2048x2048 came out harsh whatever the source size while 1792, 2304, 2560 and 3072 were clean. Masked and img2img edits with sides between 1792 and 2304 have their init image and mask resized to 2304x2304 for the same reason.
- Image models can set a minimum render area in their catalog entry (`constraints.minRenderPixels`).

## 2.1.4

### New features
- **MiniMax-H3-Image (LLM > Image > Models):** MiniMax's 20B image model, one checkpoint that both generates and edits in 6 steps, with strong prompt following, realism and text rendering, and edits from several reference pictures.
  - About 41 GB at int8: the diffusion model (19.5 GB), the VAE (1.1 GB) and the Qwen3-VL-32B encoder (18.2 GB). The encoder is shared with MiniMax-H3 video, so it downloads once. It runs with CPU weight offload on any card under 48 GB and can be both the generation and the edit default without loading twice.
  - Defaults to 2048x2048, 6 steps, cfg 1, euler with the model's fixed sigmas, and a 32 px grid. The prompt guide asks for a long, detailed English description, since a one-line prompt comes out plain. Negative prompts have no effect.
  - Edits refer to their inputs as `<Picture 1>`, `<Picture 2>` (the model's own form) and keep what the instruction does not change.
  - Needs a stable-diffusion.cpp build from 2026-11-10 or newer; update the runtime in Setup if it fails to load. Read the license note on the row before use: the license's territory excludes the US, EU, UK and South Korea, and commercial use above 1M USD revenue or as a hosted service needs MiniMax's written permission.
  - LoRAs made for MiniMax-H3-Image are recognised as such, not as MiniMax-H3 video LoRAs.

### Changes
- **Edits with MiniMax-H3-Image come out clean instead of over-sharpened.** An edit rendered at the source picture's own size came back harsh (fur, brick, skin), so it now renders at 1.5 times the source's size (capped at 16 MP) and is scaled back to the size you asked for. Inpainting and image-to-image runs are unchanged.
- **Faster MiniMax-H3-Image edits:** reference pictures are sent at no more than 1 MP whatever the canvas. A full-size reference took up to four times as long to encode and looked no better in same-seed tests. VAE tiling stays off for this model: its VAE already decodes in its own 256 px tiles, and the extra tiling doubled reference encode time.
- An image model can now opt out of VAE tiling in its catalog entry or manifest (`vaeTiling: false`).

## 2.1.3

### New features
- **Helper model (LLM > Setup > Chat defaults > More settings):** an opt-in second, smaller chat model kept loaded in its own llama-server for a mode's bookkeeping calls (the roleplay stage manager, casting, summaries and the pressure line), so those calls never take the main model's slot or evict its context cache.
  - Choose the file from your library (a 4B to 12B instruct model suits it) and its window (8k by default, 2k to 64k). It launches fully offloaded with two slots on the fastest installed llama.cpp build. With two or more cards it goes on the one with the most free VRAM; with one card it shares it. The row's caption shows Loading..., "Ready as helper::<stem> on GPU n", a missing file or the error.
  - It is a model ref (`helper::<stem>`) the chat router routes, kept out of the chat model picker. Nothing is swapped in or out to serve it: while it is off or still loading, callers use the main model as before. Changing its settings never restarts the main server.
  - **Roleplay "Bookkeeping model":** the story setup's More section picks which model answers the side calls: the story model (default), the helper model, or any listed model. The prose polish and the art audit stay on the story model.
  - The stage call is now decoded under a JSON schema (`response_format`, through local, remote and shared paths), so its reply parses whatever model answers.
  - Network Sharing hosts list the helper as a `helper` model with its own window, so a client can use a host's helper for bookkeeping while its narrator runs elsewhere.
- **Settings reorganised:** the sidebar groups tabs under Browser (General, Privacy & permissions, Passwords & autofill), AI and connections (AI & Providers, Editors & agents, API & MCP, Network Sharing) and Extensions, with About below.
  - **Privacy & permissions** takes DNS, the ad blocker, browsing data, site permissions and usage data. **Editors & agents** takes the local API, coding agents, terminal and the JetBrains, VS Code and Windhawk installers. "Security & Sharing" becomes **Network Sharing**; old links to it still open the right tab.
  - General gains a **Luma in the browser** group (Luma On Demand, Search with Shift Shift); the LLM server switches move to AI & Providers > Local models.
  - Set-once groups (IDE plugins, Windhawk mods, the API and agent tool lists, sharing tools, paired clients) fold to one line with their state ("Installed in 7 IDEs", "All 152 on") and an Install or Update button where it applies. A group that needs attention opens on its own, and your open or folded choice is remembered.
  - Provider cards are compact rows (name, what they use, a state word) that open in place.
- **"Jump to a setting" buttons** at the top of the Settings sidebar and in the LLM Setup title row open the search palette and show the Shift Shift keycaps while that shortcut is on.
- **The search palette shows each setting's current value** beside it ("On", "64k", "15 min", a model file name), using the default in effect when the setting was never changed. Dig deeper passes the values to the model.
- **LLM Setup system status line:** the Inference runtimes, Models directory and Visual grounding cards fold into one line (Runtime, Models, Vision helper) once they are healthy; click a part to open its card. A card that needs attention opens on its own and stays open for the session after you fix it. The Image tab gets the same line for its runtimes and models.
- **`npm run model:download -- <owner/repo> <file>`** downloads one Hugging Face file with the app's own resumable transfer (parallel chunks, Hub token, size check, SHA-256 verified) into the models folder.

### Changes
- **Model picker:** each local model is one compact row with its context as a small button ("64k"); clicking it opens that model's sizes in place under the row, and the list scrolls to the model in use. The model name on the chat start screen opens the picker, so the model and context can change without visiting Setup.
- **Ctrl+K, Ctrl+F and the sidebar search icon in the LLM tab open the search palette** (the code editor keeps its own find).
- **Runtime rows** show an Update button and an "Update available" badge only when a newer release exists, otherwise a quiet "Up to date". The image runtimes card keeps the catalogue behind a fold.
- **Visual grounding card:** once a vision model is set up, the other recommended models and "Choose a GGUF..." fold behind "Change vision model".
- **Extension Setup tabs are grouped** in the Setup nav: engines (beside LLM, Image and Music, such as Voice cloning), Integrations, and Developer (such as the Roleplay Lab).
- **Roleplay no longer suggests reply choices.** The "Suggest replies" block used to end every narrator reply and ride into the history and the stage call; roleplay conversations now decline it, the gear panel hides the switch there, and leftover fences in older stories are stripped before the stage reads a reply.
- **Quiet characters stay on stage.** A present character no longer times out after a few silent turns; they leave only when they clearly exit, the scene changes, or they die, and the stage call is asked to list every present character.
- **The dead stay dead:** a character killed in the story is removed from the scene on that turn and never put back by a later passage that mentions the body.
- **Roleplay Lab runs the real chat path:** text runs play every turn through the app's chat router and the production world update instead of a re-assembled request, report the model calls per turn, and check the stored records (the dead offstage, the player never in the cast). The CLI gains `--side-model` to launch a helper server, `--device`, and `--effort` for the thinking dial.
- The API docs point to **Settings > API & MCP** for the port.

## 2.1.2

### New features
- **Speculative drafters for local models (LLM > Setup):** LumaBrowser now knows where to get a block drafter for supported models, downloads it, and lets you choose what each model drafts with.
  - A recommended-drafter catalog covers Qwen3.8-27B (`z-lab/Qwen3.8-27B-DFlash2-GGUF`) and Muse Glimmer 30B (`z-lab/Muse-Glimmer-30B-DFlash2-GGUF`), Q8_0, llama.cpp only. Measured on an RTX 5090 with Qwen3.8-27B UD-Q6_K_M at temperature 0: 140 tok/s with the DFlash2 drafter against 110 with the grafted MTP head and 58 plain; at 120k context 60 against 61 (MTP) and 40 (plain). Tencent's DSpine drafter was measured too and lost, so it is not listed.
  - A model the catalog knows and that has no drafter yet gets a "Download drafter" offer on its row. The file is pinned to the repo's head, checked for free space, verified by size and SHA-256, and saved in the weights' own folder so it pairs on the next scan. It shares the model download slot, so one Cancel stops whichever is running, and a canceled download resumes.
  - Downloading a catalog model from the Hub now fetches its drafter alongside the vision projector and MTP head.
  - **Drafter dialog:** every GGUF model row gains a Drafter button (the twin of the image rows' LoRA dialog). Choose Automatic (the drafter in the model's folder), the built-in MTP head, None (no speculative decoding, files kept), or any drafter file in the models folder. The choice is saved per model; the next chat turn reloads the server with "Reloading with the new drafter…". The row shows `drafter (chosen)`, `drafter off` or an `MTP unused` badge, and a note when a chosen file has gone missing.
  - DFlash, DFlash2 and DSpine files are recognised as drafters from their header (never as chat models), pair with targets of a different architecture, and set the draft length from their trained block size (block minus one).
  - The chat speed pill's tooltip names the speculative branch that ran (drafter, MTP head, n-gram) and how many drafted tokens were accepted.
- **Body grounding in Roleplay mode:** the narrator now gets short notes on how the bodies on stage actually work.
  - A pack of 32 body-variation cards (age bands, size and build, pregnancy stages, mobility and limbs, senses, ongoing conditions) is synced into the knowledge base and matched against each character's description, plus age and height read from numbers like "78 year old" or "201 cm". An ordinary body gets no card; at most three per character.
  - A second pack of 31 "up close" cards (feet and legs, hands, skin and smell, blood and wounds, sweat and hygiene, fluids and illness) applies for the turn the player's line calls for it (boots coming off, a kiss, someone being sick), or for as long as a character's condition holds (bleeding, fever, unwashed for days). Idioms such as "cuts through the crowd" or "blood orange" do not trigger them, and each part of the line is attributed to the character it names.
  - Lasting physical details the narrator reveals (calluses, a scar, a black toenail) are recorded on the character as marks and shown back to the narrator, so they stay consistent after they leave the history.
  - Both packs can be turned off per story (`bodyGrounding`, `surfaceGrounding` options).
- **Roleplay story timeline:** the story state is now kept per reply over the conversation's message tree. Regenerating a reply, switching between variants or removing a turn shows the world exactly as it stood at that point, instead of building on a replaced reply's changes (which used to double its clock, turn count and threads). Images are stored once and shared between branches.
- **World-update line under each roleplay reply:** shows the running step while the world updates, then a collapsed list of what the reply changed (cast, place, mood, outfit, condition, bond and so on), or that it was stopped.

### Changes
- **Regenerating in Roleplay mode no longer waits on the old reply.** The replaced reply's stage, casting and image work is stopped at once and its model calls aborted, and a new turn waits (bounded) for the previous reply's world update before reading the state.
- **Roleplay narrator context is leaner and safer at small windows.** The body notes sit early in the prompt so llama-server's prompt cache keeps them; the story-so-far no longer repeats the open threads the scene notes already carry; inline `<think>` reasoning is stripped from earlier replies; the history leaves at least 1024 tokens for the reply; and the scene notes' closing rule is never the part a clip cuts.
- **Characters no longer flicker off stage.** A character the stage call happens not to mention stays present in the same scene for up to three turns, unless they leave explicitly or the scene changes.
- **Smaller stage call with images off:** the illustration and wardrobe-slot fields are asked for only when the story draws reaction images or avatar art (about 2,770 down to 2,120 tokens per turn). Turning images on mid-story is safe. The character's condition is now rewritten each turn rather than appended to.
- Launch planning prices the recurrent-state checkpoints a hybrid target (such as Qwen3.8-27B) keeps per drafted token, so speculative decoding no longer overcommits VRAM. The speculative-decoding notes no longer promise identical output to a plain decode.
- **Roleplay Lab:** new text scenarios `body`, `reveal`, `wound`, `jungle` and `control` (`npm run rp:text -- --scenario <name>`), a physicality judge and a reveal judge, a body-detail rate, a per-turn context audit, and `--no-grounding` for A/B runs.

## 2.1.1

### New features
- **Password manager and autofill (Settings > Passwords & autofill):** LumaBrowser now offers to save sign-ins and addresses and fills them back.
  - A bubble under the address bar offers to save a new login or update a changed password after a sign-in; two-step sign-ins pair the username with the password that follows. A key icon in the address bar lists the page's saved logins. Focusing a sign-in field shows the matching logins in a chrome overlay that pages cannot read, with arrow keys, Enter and Escape; a new-password field offers a generated 20-character password.
  - Logins fill only on their own site (exact origin or the same registrable domain) and never on a plain-HTTP page, so a lookalike page cannot receive one. Addresses and contact profiles fill any checkout form.
  - The vault is sealed with the OS keychain (DPAPI, Keychain, secret service) and stored in the settings database. An optional master password (scrypt hash, auto-lock after 5 to 240 minutes, slow-down after wrong guesses) gates reveal, copy, edit, export and assistant use; ordinary autofill keeps working while locked.
  - Passwords panel: search, add, edit, show, copy, delete, never-saved sites, two-factor secrets (RFC 6238 codes from a base32 key or otpauth link), CSV import from Chrome, Edge, Firefox and Bitwarden, and CSV export. An Addresses panel manages profiles, and an API keys panel holds tokens the assistant can use through `{{vault:name}}` placeholders.
  - **Assistant use, opt-in per item.** New `vault_list` and `vault_fill` tools in the Password manager group: the model sees names, sites and masked usernames, never a secret; LumaBrowser types the value in, and each fill is confirmed by you. Keys are swapped into `send_webhook`, `send_notification_ntfy` and `run_command` only. Outside callers (REST, MCP, terminal, shared or unattended runs) are refused unless "outside AI tools" is switched on. Every attempt lands in an always-on audit shown in the panel, and saved secrets are replaced with `[vault:name]` in every tool result headed for the model.
- **Search palette (Shift Shift):** tap Shift twice anywhere to search settings across the Settings window, extension pages and the LLM tab's Setup and Tune pages by name or plain description, plus conversations by title and full text, artifacts, open tabs and browser commands with their shortcuts. Typos and filler words are forgiven, the empty box lists the last five places you were, and a chosen setting opens where it lives and is highlighted. "Dig deeper" (Tab) has the chat model answer from your settings, chats and the documentation with openable citations, and "Continue in chat" carries it on. Off switch in Settings > General > Browsing.
- **Private windows:** Ctrl+Shift+N or the menu opens a window on its own throwaway session, titled "LumaBrowser (Private)". Private tabs are left out of history, session restore and the palette's Recent list; the palette shows a Private badge.
- **New tab page (`luma://newtab`):** a search box for your search engine and up to eight most-visited sites from the last 90 days, with an x to hide a site. "New tabs open" chooses between it and the start page for Ctrl+T, the + button and the first tab.
- **Pinned tabs:** Pin tab from the tab menu keeps a tab at the front of the strip as an icon only, skipped by Close other tabs and Close tabs to the right, and reopened at the next start even with Restore tabs off.
- **Site info behind the lock:** clicking the address bar badge shows the connection, the site's camera, microphone, notification and pop-up answers (Ask, Allow, Block), a per-site ad blocker switch and the site's cookies with a delete action.
- **Pop-up blocker:** a page may open a new tab or window only within 5 seconds of your click, tap or key press, or when its site is allowed. Blocked opens show an address bar icon with open and always-allow actions.
- **Notification permission prompts:** sites now ask before showing notifications, with the answer remembered per site; extensions and app pages are always allowed.
- **Full screen:** F11 hides the chrome; a video's full-screen button covers the window and leaves cleanly on Esc, on tab switch or when the page exits. A short hint says how to get out.
- **Clear browsing data (Ctrl+Shift+Del):** Settings > Privacy clears history and the downloads list by time range (hour, day, week, 28 days, all) and cookies, site data and cache on every browsing session; app pages keep their data. Replaces the separate clear history and clear cache menu entries.
- **Make LumaBrowser the default browser:** Settings > Browsing registers it with the OS (per-user registry on Windows, protocol client on macOS, xdg-settings on Linux) and opens the system chooser. Local `.html`, `.htm`, `.xhtml`, `.shtml` and `.svg` files passed on the command line, or opened from the OS, open in a tab.
- **Spelling in the context menu:** right-clicking a misspelled word offers up to five suggestions and "Add to dictionary".

### Changes
- **Downloads persist across restarts.** Finished downloads reappear in the downloads popup, files that were since removed are marked Deleted, and Clear removes them.
- **Address bar suggestions** now include open tabs ("Switch to this tab") and bookmarks matched on every word of the title or address, host prefix first, without repeating an address already listed.
- **Session restore** saves only pinned tabs when Restore tabs is off, and never saves private tabs.
- Right-clicking a link gains "Save link as" next to "Open link in default browser".
- The settings menu gains Passwords and New private window entries; the address bar badge tooltip explains the connection state and that clicking opens site settings.
- The chat side panel and conversation view accept palette deep links to reveal a setting or open an artifact in its conversation.

## 2.1.0

### New features
- **Your agents in JetBrains Air and Zed (`luma acp`):** the CLI now speaks the Agent Client Protocol over stdin and stdout, so editors that host ACP agents can run your LumaBrowser agents in their own chat panel. The work happens in the running LumaBrowser, started hidden when it is not up.
  - Turns stream back as session updates; tool calls appear as the editor's own tool cards with kinds, titles, file locations, diffs and command output. Mutating tools ask for permission in the editor (Allow once, Allow for this run, Reject). Cancel aborts the turn, and reopening a session replays its history. Which agent answers is a session option (default Code).
  - Flags: `--agent <name>` to answer as a named agent, `--yes` to skip permission prompts, `--no-start` to fail instead of launching LumaBrowser.
  - **Settings > LLM > Connect your agent** gains a JetBrains Air connector that registers LumaBrowser as an Air agent in `~/.jetbrains/acp.json` and our MCP server in `~/.jetbrains/mcp/mcp.json`. Air is detected from its config folder or from Air option files in any installed JetBrains IDE; the command points at the app binary in Node mode with the installed or bundled CLI.
- **Video generation over Network Sharing:** a paired LumaBrowser can render clips on this computer's video model.
  - Hosts get a "Local AI video generation" share toggle (on by default like the image ones) and a `POST /sharing/video/generate` route. The clip streams back base64 in the done event and is stored on the client only; the host keeps nothing. Video requests queue separately from image requests.
  - Clients see "video generation" on a peer's card and in the peers list, and Settings > Providers gains a "Default video generation" row alongside image generation and editing. Picking a peer there routes the chat's video and animate-image tools to it, with the usual progress, preview and done notices labelled remote.
- **JetBrains plugin: install automatically in every IDE.** A new switch in Settings installs the plugin in every JetBrains IDE found now and keeps new IDEs and versions current each time LumaBrowser starts. The IDE list shows the newest version of each IDE, with a "Show N older versions" link for the rest, and "Install everywhere" is described as a one-time action.

### Changes
- **The local API server keeps retrying its port instead of giving up.** When the REST gateway cannot bind (port held by another program), LumaBrowser retries every 2 seconds for a minute, then every 30 seconds for as long as it runs. The port is never swapped for a free one, since the CLI handshake, exported MCP configs, Network Sharing and user scripts all point at the configured port.
  - On the first failure the port is inspected. If another LumaBrowser already answers on it, this copy explains that only one runs at a time and quits. Otherwise the holder is named from the OS listener table where possible and a desktop notice links to Settings > API & MCP.
  - **Settings > API & MCP** shows the server's status under the Port field, with the holder's name and a one-click "Use port N+1". The LLM setup page shows a banner while the server is down, and extension tabs explain that they load from the local API server rather than failing silently. An extension bundle that fails to load, or loads but never registers its tab, now says so in its pane after 20 seconds.
  - The health endpoint now carries `app: "LumaBrowser"` so another copy can be told apart from an unrelated program.
- **Internal tabs verify they loaded our page.** The LLM and Dashboard tabs check for their own root element after loading from the gateway. If another program on the port served a foreign page, the tab is treated as failed and retried instead of showing someone else's content.
- The code-mode terminal gains a `history` command that returns the conversation's messages.
- `cli/lib/docs/remote-access.md` now lists the image edit and video generate sharing routes.

## 2.0.9

### New features
- **Browse CivitAI (image models):** the Image setup Models card gains a "Browse CivitAI" button next to "Import custom model".
  - Search as you type, or paste a civitai.com model or download URL. Filters for type (checkpoints install; LoRAs browse only), base family (installable bases, Illustrious, Pony, SDXL, SD 1.5, Flux/Chroma, Qwen, Anima, video, any), sort order, an Adult toggle and "Load more" paging. Hovering a row preloads its page.
  - The detail pane shows the versions, sample images, trigger words, the creator's licence terms (commercial use, credit, derivatives) and the model page rendered as Markdown. Each version carries an install verdict, so a version the server cannot run says so before you click Install.
  - **Install derives a recipe.** The creator's description is read by the model in the `image-server.civitai-reader` slot, up to 60 sample images are tallied for the settings most of them agree on, and the base template fills the rest. Steps, CFG, sampler, scheduler, size and negative prompt become the import's defaults, with the source of each recorded; trigger words and notes are appended to the prompt guide. The download detail shows which settings came from where. CFG stays locked on Flux and Qwen bases, steps on Qwen edit.
  - Downloads carry the listing's size and SHA-256, so a mismatched file is refused before transfer or fails verification afterwards. A 401 or 403 from civitai.com is reported as access denied, with wording for "no key" versus "key refused".
  - **API key:** an optional CivitAI key in the modal (saved in settings, or taken from `CIVITAI_TOKEN` / `CIVITAI_API_KEY`). It is sent only to civitai.com hosts and never reaches the page. The Adult toggle is stored alongside it.
  - The import manifest gains a `civitai` block (model, version, file, hashes, base, creator, page URL, trigger words) and the derived `recipe`.
  - Network: searches, model pages and sample-image meta go to `civitai.com/api/v1`, downloads to `civitai.com/api/download`, and thumbnails load from `image.civitai.com`. Searches and pages are cached for five minutes.
- **Media viewer in the chat panel:** images and videos open in a dedicated viewer instead of the artifact iframe.
  - Wheel zoom around the cursor, drag to pan, double-click to toggle fit and 1:1, toolbar zoom with an 8x ceiling. Light or dark checkerboard backdrop, remembered.
  - A filmstrip of every image and video in the conversation with previous/next and a counter; neighbours are prefetched. Keys: arrows to move, + and - to zoom, 0 fit, 1 actual pixels, I details, B backdrop, F theater, Space play/pause, comma and period to step frames.
  - Videos get transport controls: play/pause, frame step at the recorded frame rate, seek, elapsed time, speed 0.25x to 2x, loop and mute.
  - A details drawer shows the prompt and the render facts (model, size, seed, steps, CFG, sampler and scheduler, fps, frame count), falling back to the tool call's prompt for older artifacts. Actions: copy prompt, copy image, download, mark an area, use as reference, make another.
  - Generated and edited images and videos now carry their render details with the artifact, so the drawer survives a reload.
- **Resizable panel and theater mode:** drag the artifact panel's left edge (arrow keys step it, double-click resets, width remembered). A Theater button or F hides the chat column so the panel fills the stage; Esc returns.
- **Media chips:** a turn with one image or video shows it as a large hero chip; several render as a square grid.
- **DeepSeek V4 / V4.1 and Ripple models:** new `deepseek4` and `ricursive` model families with the right chat template flags. DeepSeek's DSML tool-call markup (V3.2, V4 and V4.1 variants) is now parsed when it arrives as text, so tool calls run instead of showing as raw markup; the reply collapses into the tool card as soon as the markup starts streaming.
- **Hugging Face search:** results sort by trending, each row shows parameters, context length and architecture with a fit dot, and a "Fits this PC" toggle (on by default) hides models whose Q4 estimate exceeds this machine. Embedders, speech, diffusion and companion repos (mmproj, VAE, text encoders) are filtered out, with a count of what was hidden. Hovering a row preloads its quants and readme. Searches, cards and the hardware budget are cached for minutes.
- **Roleplay: the world pushes back.** A new story-editor pass sets a pressure line (what bears down on the player and how soon) and pins the premise's central thread, on the first turn and after each summary. The narrator is briefed that characters pursue their own wants, may refuse, lie or leave, and that stalling has consequences.
  - Characters now have a `history` (backstory, fixed once set) and `bonds` with other cast members; the casting director sees the rest of the cast and is told to make each new character unlike them. A Past field is added to the profile editor.
  - Story threads are ranked (pinned, then most touched, then most recent) instead of newest-first, and eviction drops the lowest-ranked. The stage can mark a character's secret as `revealed`, which clears it from the card immediately.
  - Lab: a cast probe grades voice and dialogue distinctness per pair and narrator initiative; text runs now use the same samplers as chat turns.

### Changes
- **Tool manuals are delivered once in the task,** not re-injected into the system prompt. The system prompt's group set freezes on a conversation's first turn; groups activated later get their manual at the head of that turn. The time of day moves from the system prompt to the per-iteration reminder, and the reminder is kept in history rather than copied. Together with prior turns now sent as real chat messages (byte-identical to what was first sent, recorded in a new `sent_content` column), llama-server keeps its cached prefix across turns.
- **Local requests tell the server how heavy they are.** Requests that offer artifact or code-validation tools are marked heavy and ask the LumaByte server for a 128-token expert-cache batch, so short agent prompts keep reading the MoE cache.
- **MoE placement on LumaByte builds:** when the expert pool is larger than 70% of RAM the launch locks a RAM tier (`--moe-ram-mib`, half of RAM, at least 4 GiB, luma-b5+), registers a DMA share (`--moe-ram-register-mib`, luma-b6+) and writes a per-model expert profile. The GPU expert cache picks a prompt micro-batch of 512 to 4096 tokens that fits 35% of the fill budget. On two or more cards the cache is capped by what the layer split can pack, and on mixed cards the model is held to one card rather than spilling onto the slower one. Serving notes explain where experts live, the micro-batch chosen and the VRAM held back. Flags are gated by the runtime's luma tag; mainline builds never receive them.
- **Image server launch:** text encoders now always run on the GPU (the catalog's `--clip-on-cpu` is dropped unless the runtime is CPU-only or `SD_CLIP_ON_CPU=1`). With two or more cards, a model moves to the card with the most VRAM under a `--max-vram` budget when that card has 8 GB free and the slot is not pinned. `--eager-load` and `--vae-tiling --vae-tile-size 1024` are passed when the binary supports them, cutting a 1 MP VAE decode from about 8 s to under 1 s.
- **Native tool array bounded:** inactive groups' stub schemas are dropped when the tool array would exceed a quarter of the slot's context.
- **Runtime installs stop the servers first.** Reinstalling a runtime stops the chat server and group router that run from it and resumes the router afterwards. A wipe that leaves locked files fails with the file names instead of extracting over them.
- **Imports check companions before download.** URL and local imports of Qwen and Anima bases are refused up front when the companion set is missing; the Anima message names Anima Turbo and the Extensions add-on.
- **Roleplay samplers:** the `dry_penalty_last_n: -1` setting is removed from the roleplay sampler set.
- Image and video runs record the model and the settings used (steps, CFG, sampler, scheduler) for history.

### Bug fixes
- **Large downloads no longer look stuck on "Resuming":** verification hashes in 8 MB reads and reports at most four times a second instead of once per chunk, which on a 200 GB file produced millions of progress messages.
- **Every local roleplay turn failed on runtime build 11731** with "Value must be between 0 and 2147483647", caused by the removed `dry_penalty_last_n: -1` sampler.
- **Revealed secrets stayed on the character card** until the next fold, so the narrator kept guarding what the summary said was out. A reveal now clears the secret at once.
- **First turn used the wrong tool-call mode** on a cold start: the model family is taken from the live plan only when the plan is for the requested model, so turn one no longer runs on the text fence while turn two runs natively.
- **DeepSeek-V4.1-Flash on a 16k context** failed with HTTP 400 before reading the task because the native tool array overflowed; see the bound above.
- **Resuming a download lost its part label** in the overlay, and the overlay now shows a Verifying phase.
- **Hidden Mark and Share buttons in the panel header** were still rendered because the button style overrode `hidden`.

## 2.0.8

### New features
- **Window tabs (Windows):** open any desktop window as a live tab in LumaBrowser.
  - Ctrl+Alt+Shift+T opens the window in front as a tab, or shows its tab if it already has one. The shortcut hint offers "Open as tab" for the picked window. The shortcut can be rebound or cleared.
  - The tab shows a live picture of the window at up to 60 frames per second (30 by default). The app's icon and title appear on the tab; minimized and closed windows are reported, with a Restore button for the taskbar.
  - A **Text** panel shows the window's accessible text as read through UI Automation, refreshed every 10 seconds on the active tab (3 to 120, configurable) and every 45 seconds in the background. The chat can read a window tab like any other tab.
  - A **Control** switch sends your clicks, right-clicks, scrolling, typing and key combos on the live view to the real window. Input goes through desktop control, so the same gate, Pause and Stop apply as to the agent's own actions, and the window comes to the front for each action. Can be turned off in the feature's settings.
  - "Another window" picks a different window for the same tab. LumaBrowser's own windows, the desktop and the taskbar cannot be opened.
  - Because a window tab is an ordinary tab, Tab Share can stream it, and a guest with an interact link can drive the window through it.
  - REST: `GET /api/ext/desktop-integration/window-tabs/` lists open window tabs; `POST .../open` and `POST .../close` take an `hwnd`.

### Changes
- Desktop click and scroll accept physical screen coordinates (`sx`/`sy`) from callers that have their own picture of the window, refused outside the window's rectangle. Not offered to the model, whose coordinates still come from screenshots.
- Input a person passes through a window tab is tagged as the user's own and does not appear on the desktop activity island or count as a run.

### Bug fixes
- **The desktop activity ring could flash the whole screen orange** under GPU load: its ignition sweep and comets were full-screen fills hidden behind CSS masks, and a late mask frame let the fill show. The ring is rebuilt from four edge strips clipped by overflow, with animations generated for the actual edge lengths so the sweep and comets keep one speed on any monitor. The top is still brightest, fading down the sides.


## 2.0.7

### New features
- **Extend a picture (outpaint):** asking an edit model for any frame other than "match" now extends the picture instead of reshaping it. The original is kept whole inside the new frame and only the new space is painted in.
  - A new `anchor` (center, top, bottom, left, right) says where the original sits, so a head-shot made full-body keeps the head at the top.
  - The new space is filled by continuing the scene; the original pixels are restored exactly afterwards.
- **Marked-area editor, second pass:**
  - Rectangle and Fill tools join Brush and Eraser. Fill paints an outlined pocket; Invert swaps the marked and unmarked parts.
  - Zoom with the wheel (up to 8x), pan with Space-drag or the middle button, and a "Fit" button to see the whole image again.
  - A dashed box shows the close-up the model will actually see for a small area, with a one-line description underneath.
  - A brush ring follows the cursor, the size is shown in pixels, and `[` / `]` or Alt+wheel change it.
  - Keyboard: B, E, R, F pick a tool, I inverts, 0 fits, Ctrl+Z undoes, Esc closes.
- **Unchanged parts stay unchanged:** after a whole-image edit on an edit model, any part the model did not visibly alter is restored from the source, so a slight colour drift no longer creeps in across edits. A change to most of the picture (a restyle, a new scene) keeps the full render. A deliberate subtle whole-picture change (a warmer tone, a soft-focus look) can pass `keepUnchanged: false`.
- **Marked-area edits on edit models are held to the area** by the mask while rendering, not only composited afterwards. Qwen-Image edits of a marked area run 12 steps instead of the full count.
- **Qwen-Image-Edit 2511** in the image model catalog (Q4_0 through Q8_0): less drift between edits and better consistency with several people in one picture.
- **Add a folder of knowledge documents:** the knowledge base and agent knowledge sections accept a folder and import every PDF, Markdown, text or HTML file in it and its subfolders. An empty folder reports which file types are supported.
- **Windows on Arm:**
  - The LumaByte stable-diffusion.cpp build (CUDA 13) is available on Arm, and is the GPU image build for RTX Spark machines.
  - whisper.cpp CPU and CUDA 13 runtimes on Windows on Arm, and a CPU runtime on Linux arm64.
  - The arm64 installer is now named `LumaBrowser Setup <version>-arm64.exe`, so it no longer collides with the x64 installer in a release.

### Changes
- **Model folders keep to their own kind.** The LLM scanner skips the image models folder when it sits inside the LLM folder, and the image scanner does the reverse.
- **Image and video GGUFs no longer appear as language models.** Diffusion architectures (Flux, SD, Wan, Qwen-Image, LTX and others) and GGUFs with no architecture at all are set aside by the LLM scanner and reported as skipped. The header cache rebuilds once after updating.
- **The "Harmony format" row is gone from the runtimes list,** and gpt-oss models no longer carry a "requires harmony" tag. Every current llama.cpp build supports it.
- **Runtime advice:** a runtime with no prebuilt download for this PC's platform is marked "not for this PC" instead of offering an install that cannot succeed. CUDA runtime preference also favours builds that exist for the platform.
- ik_llama.cpp and ninfer runtimes are offered on x64 only; they have no Arm builds.
- The edit prompt guide covers text replacement ("Replace the text 'OPEN' with 'CLOSED', keeping the same font"), the new `keepUnchanged` and `anchor` options, and advises building a new change on the earliest version that already has what the user wants, since every pass softens the picture a little.
- The edit result message reports how much of the picture changed and whether the rest was restored.
- The image runtime picker lists the LumaByte sd.cpp build between CUDA 12 and Vulkan.
- The CPU stable-diffusion.cpp runtime also accepts upstream's new `cpu` asset name, and the whisper.cpp CUDA runtime its new `win-cuda-12` name.
- Terminal install scripts are written with forward-slash paths.

### Bug fixes
- A chat mode's forced tool groups were saved into the conversation's active groups, so they stayed on after switching modes. Forced groups are no longer persisted.
- GPU diagnostics: non-CUDA adapters reported by nvidia-smi (no compute capability or memory) are dropped, the CUDA version falls back to the driver's user-mode version when the usual field is missing, and the cached diagnostics are refreshed when a card's total VRAM no longer matches the live reading (a swapped GPU, for example).
- SageAttention device pinning tolerated devices without an index; they are now numbered in order.
- An update manifest merge now fails with "Duplicate installer name" rather than letting two architectures upload the same file.


## 2.0.6

### New features
- **Mark an area to edit:** paint a region on any image in chat, the composer or the Artifact panel. The editor has a brush, an eraser, undo and a note field.
  - "Edit now" sends the edit straight away. "Add to message" leaves the area as a chip you can reopen.
  - Only the painted area changes; everything outside it is restored pixel for pixel from the original.
  - Works with every image model. Img2img gets a softened mask; edit models without mask support get the location in words.
  - Small areas are edited on an enlarged close-up, then pasted back. Seams follow the model's nearby changes.
  - Marked areas are saved with the message and shown as chips after reload.
- **Desktop run controls:**
  - A glowing ring frames the window the agent is working in.
  - An on-screen bar shows the current action and step ("Step 7 of 24, 42 s, in Notepad"), with Pause/Continue and Stop.
- **New global shortcuts:**
  - Ctrl+Alt+Shift+Space pauses or continues the agent.
  - Ctrl+Alt+Shift+Esc stops desktop control at once.
  - Ctrl+Alt+Shift+Y / N answers Allow / Deny.
  - All of these can be rebound.
- **Approvals while LumaBrowser isn't focused:** the question appears on the on-screen bar with Allow, Allow for this chat, Only this window and Deny.
- **"Only this window" approval:** desktop control is granted for one window for the rest of the conversation.
- **Sign-in / CAPTCHA / bot-check detection:** the agent stops and hands control to you, with Done / Skip this step / Stop.
- **Sensitive desktop actions always ask** (password fields, checkout, payment and banking windows), even after desktop control was allowed for the chat. Unattended runs refuse them.
- **REST control of desktop runs:** `/api/desktop/agent-run/` with pause, resume, stop and approval.
- **Linux desktop integration:**
  - Wayland global shortcuts and paste work through a background X11 bridge (needs XWayland).
  - KDE/KWin places the overlays correctly.
  - The Ctrl+Alt+Shift hint now also works on macOS and Linux.
- **Roleplay memory:**
  - Each character keeps a profile, a per-turn chronicle and a live state (mood, intent, last seen).
  - A shared story record tracks events, the in-story clock and open plot threads, with a running "story so far" summary.
  - New characters get a profile written automatically.
- **Roleplay setup:**
  - A "You" section for your name, pronouns and persona.
  - Reply length: Snappy / Balanced / Lush.
  - An optional "Polish each reply" pass that rewrites stock AI phrases.
  - DRY / XTC / min_p anti-repetition samplers, on by default for local models.
- **Roleplay Lab "Text run":** a scripted 10-turn playthrough that checks memory and prose quality, with an optional AI judge.
- **Windows on Arm (Snapdragon X):**
  - arm64 installer and portable builds, with auto-update for both architectures.
  - arm64 llama.cpp (CPU, CUDA 13, Vulkan) and Sherpa TTS runtimes.
  - A new "llama.cpp (OpenCL, Adreno)" runtime for Qualcomm GPUs.
- **Intel driver install on Linux:** shows which Intel compute pieces are missing and offers "Install in a terminal" (the app never sees your sudo password) or "Copy command".
- **Runtime advice:** each runtime is marked "recommended" or "not for this PC" with a reason, and unsuitable ones sort last.
- **Per-model "Run timeout" (0–240 min) and "Run steps" (1–400)** for Tools-on turns.
- **Smarter error cards:** timeouts offer "Continue" and an "Edit run timeout" link. Other errors link to the setting to change, with it outlined.
- Collapsible sections in chat-mode settings forms.

### Changes
- The model treats text from tools, web pages and windows as content to read, never as commands to follow.
- Window snapshots mark password fields.
- Lumabyte can take up to 12 actions per reply (configurable, 1–30).
- **Roleplay:**
  - Simpler setup form; advanced options moved to "More".
  - Smaller prompts: only characters in the scene get full cards, and history is trimmed to a token budget.
  - Rewritten narrator instructions.
  - Images are now optional.
  - Memory follows setup edits, restarts and removed turns. Saves upgrade automatically to data version 2.
- Chat modes can now supply their own history, post-message notes, sampler overrides and reply rewrites.
- Triggers and Timed Tasks warn when a run will use state-changing or desktop tools without asking.
- The image-editing guides explain marked areas. A region edit always keeps the source's shape.
- README adds Windows on Arm and a "Computer use that stays on your machine" section.
- Linux frameless window corner rendering reworked.

### Bug fixes
- The desktop activity ring was drawn against the wrong edge on maximized or screen-edge windows.
- Roleplay scene state went stale when images were off; the scene tracker now runs every turn.
- Long roleplays were summarised by the generic compaction under coding headings; roleplay now uses its own story summary.
- Stopped or empty roleplay replies no longer trigger scene, memory or image updates.
