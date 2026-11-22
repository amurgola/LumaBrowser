# Changelog

## 2.2.6

### New features
- **Basalt Runtime (add-on 1.1.0): a faster engine for NVIDIA RTX 50 series cards.** The add-on adds Basalt as a runtime in LLM > Setup, with five models made for it that install in one click. Basalt runs on Windows and Linux.
  - On one RTX 5090 with Qwen3.8 27B it wrote replies about 1.7 times as fast as llama.cpp and read prompts about 4 times as fast. The two ran different files of the model: NVFP4 on Basalt, Q6_K on llama.cpp.
  - There are two builds, and both load the same models. "Basalt upstream (RTX 50 only)" is the engine's unmodified release. "Basalt LumaByte (RTX 50 + RTX 30/40 second card)" can also put part of Qwen3.8 Flash Next on a second card of the RTX 50, 40 or 30 series. A model set up with one build runs on the other.
  - The models are Qwen3.8 27B (21 GB), Inkling 2 Mini (20 GB), Qwen3.8 Flash Next (132 GB), Hy4-flash (159 GB) and DeepSeek V4.1 Flash (260 GB). The three large ones keep most of the model in system RAM, so they need a lot of it. All five can read images.
  - The main card must be an RTX 50 series card with a driver of the R580 branch or newer, and the install needs Python 3.10 to 3.13 on the computer. A computer without them is told so before anything is downloaded.
  - Basalt loads only its own `.basalt` model files, not GGUF files.
  - A second card is used only when the model's extra flags name the cards, for example `--gpu 0,1`. The VRAM figures in Setup do not count a second card chosen this way.
  - The engine's makers have not measured its output quality on Windows.
- **Chat: a slow tool call no longer holds up the reply.** A tool call that is still running after 8 seconds is moved to the background, and the assistant goes on with the rest of your request. The reply used to sit silent until the call returned.
  - This covers a long terminal command and the tools of add-ons and MCP servers. Picture, video and music renders, the browser tools and the desktop tools are not moved.
  - The call shows in the background tasks strip above the message box, with Cancel, like a task the assistant started itself. Its time counts from when the call began.
  - It works where background tasks do: in plain chat.

### Changes
- **Background tasks in chat:**
  - A task that finishes while the assistant is still working is given to it at once and used in the same reply. Its result used to arrive only when the reply and every other task from it had ended. A task that made a picture, a video or music, and a task you stopped, are still reported after the reply.
  - After it starts a task, the assistant goes on with whatever else you asked that does not need the result. It used to end its reply there. A queued render still starts only when the reply has ended.
  - The assistant is told plainly that a queued picture, video or song has not been made yet, so that it does not describe one before it exists.
- **Chat: the first use of a tool takes one step less.** A call to a tool whose instructions were not loaded yet used to be sent back with the instructions, and the assistant had to make it again. The call now runs at once and the instructions come with its result. Picture, video and music renders still get their instructions first, because a render made the wrong way costs minutes.
- **Terminal: a command wrapped in a second PowerShell is sent back once.** When the assistant sends `powershell -Command "..."` to a terminal that is already PowerShell, the outer shell can break the variables and quotes inside before the inner one reads them. Such a command is not typed; the assistant is told to send the command by itself. If it sends the same line again, it is typed as it is.
- **Recommended models are up to date (LLM > Setup).**
  - Qwen 3.8 27B is the pick for any computer with 24 GB of video memory or more. It replaces Qwen 3.6 27B and Gemma 4 31B.
  - Qwen 3.5 4B and Qwen 3.5 9B are the picks for smaller computers. They replace Gemma 4 E2B and Gemma 4 E4B.
  - Models are offered by how capable they are, then by size. Qwen 3.8 27B is now offered ahead of the larger Qwen 3.6 35B A3B, which scores lower. The 35B stays as the fast pick for computers with a lot of system RAM.
  - Gemma 4 26B A4B is listed with its full context of 262,144 tokens. It was listed with 131,072.
  - Models you have already downloaded stay installed and keep working.
  - A file whose name only starts with the name of a recommended model, such as a fine-tune or a draft model, is shown under its own name.

## 2.2.5

### New features
- **Inkling 2 models are supported.** LumaBrowser recognises Thinking Machines' Inkling 2 Mini and Inkling 2 Small, uses the sampler settings their makers recommend and lets them call tools natively.
  - They need a llama.cpp runtime of build 12600 or newer. The "llama.cpp (LumaByte)" runtime does not load them yet.
  - The VRAM estimate counts what is particular to these models: a group of layers that runs several times for every token, and working memory that grows with the context.
  - At a large context the prompt batch is made smaller, so the model stays whole on one card. That is far faster than a split over two cards. Prompts are read slightly slower and replies are not affected. The launch notes say when this was done.
  - The full-size window cache is left off for these models. It brought no prompt reuse, read prompts less than half as fast and held more VRAM. The launch notes say so.
  - Only Inkling 2 Mini has been tested so far.

### Changes
- **VRAM estimates are closer to what a model really uses (LLM > Setup).**
  - The estimate counts the working memory that grows with the context size, on every card of a split, and leaves out the part of a model that stays in system RAM. The small Gemma 4 models were estimated far too high: Gemma 4 E4B at 8.3 GiB for a load of 4.7 GiB.
  - A draft model is counted with the memory it needs to run, not only the size of its file. In a split, all of it is counted on the card that holds it.
  - A split over two cards fills the faster card a little further, now that each card's use is known more exactly.
  - For a mixture-of-experts model with part of its experts in RAM, the estimate includes the room that is kept free for reading prompts. The model is placed as before; the number shown was too low.
- **A fit test result is used only for a launch like the one it measured.**
  - A stored result is set aside when the runtime build, the window cache, the draft model or the expert offload is not what it was measured with. The estimate is used and the launch notes say so. A result used to be trusted whatever was launched, which could split a model over two cards when it fits on one.
  - Results stored before this update are set aside in the same way until you run the fit test again. The fit table still shows their numbers.
- **Chat: loading tools in the middle of a conversation no longer makes the model read the whole conversation again.** This applies to models that call tools natively.
  - Loading a tool group changed the list of tools sent to the model, and with it the start of the prompt, so the whole prompt was read again each time. In a long conversation that could take close to a minute per group.
  - The list now stays the same for the whole conversation. A tool loaded later is run through one fixed function, `call_tool`, and its card shows the real tool as before.
- **A model that is newer than the runtime is reported as such.** Starting one used to say the model file may be damaged and to download it again. The message now says the runtime is older than the model, and to update the runtime or pick a newer one.
- **The model lists in Setup and Image Setup no longer flicker during a download.** Every progress update redrew the list, so the row under the pointer lost its highlight and a control in that row lost the keyboard focus. Only the values that changed are written now.
- **Personal Hub:**
  - The assistant knows more about the people in your activity: the context a contact belongs to (a company, for example), and how often and through which apps they have written. People with nothing recorded about them are listed too, and the assistant reads their messages before it says who someone is. It used to guess from a single message.
  - The assistant sees who a task from a task tracker is assigned to. The names were unreadable to it.
  - `hub_list_contacts` gives the context of each contact by name.
- **`luma` command (Windows):** LumaBrowser started with the `luma` command from a program that runs in a Windows compatibility mode no longer takes over that mode. Its window had square corners when it did.

## 2.2.4

### New features
- **Plans in chat.** When a request takes several steps, the assistant writes a plan first and works through it.
  - The plan sits above the message box with a progress bar and the state of each step. It can be folded to one line or cleared, and it goes away when the last step is done.
  - Each step also shows in the thread as a card ("Step 2 of 4: …"), so you can see where each part of the work began.
  - The plan is kept with the conversation, so it is still there after a restart.
  - If the assistant answers while steps are still open, it finishes the plan first and then gives its full answer.
  - A plain question or a single lookup is not planned. Plans work in chat and in Code mode.
- **Send messages while the assistant is still working.** Press Enter while a reply is being written and your message is queued. It used to be ignored.
  - Queued messages wait in a strip above the message box, each with Edit and Remove.
  - They are sent one at a time, in order, each when the reply before it has finished.
  - If you stop a reply, or one fails, the queue waits until you press "Send next".
  - The queue belongs to its conversation and is cleared when the app is closed.
- **Background tasks in chat.** The assistant can start a long job in the background, end its reply, and report back when the job is done.
  - A strip above the message box shows how many tasks are running and lists them, each with Cancel.
  - When the tasks finish, the assistant writes its report without being asked, joined to the reply that started them. If you kept chatting in the meantime, the report waits for the current reply and follows as a message of its own.
  - Pictures, videos and music started this way are made one after another.
  - A long terminal command is followed until it finishes, past the 10 minutes a command in a reply may take. This needs "Let AI use the terminal" to be on.
  - Background tasks work in plain chat, and they end when the app is closed.
- **LoRA Trainer (experimental): train a LoRA from your own pictures.** Give the assistant pictures of a character, an object or a style and ask it for a LoRA. It captions the pictures, trains the LoRA for one of your installed image models and adds it to your LoRA library.
  - Pictures can be chat attachments, a folder or file paths.
  - Image models that can be trained carry a "LoRA trainable" badge in Image Setup: SDXL and SD 1.5 models (Pony-style models included), Anima, Z-Image, FLUX.2 klein 4B, Chroma, MOSS-Image, Qwen-Image 2.1 and MiniMax-H3-Image.
  - While it trains, a strip above the message box shows the step count and the time left, with Cancel. The result is posted in the conversation when it is done, with the LoRA's trigger word.
  - Ask the assistant to apply the LoRA and it is attached to an image model of the same family.
  - **Your pictures stay on your computer.** Captions are written by a model running on this computer only, never by a cloud provider or a paired PC. The trainer sends no usage data, and its working files are deleted when the job ends.
  - It needs Windows or Linux and an NVIDIA GPU. The first run downloads the trainer (several GB) and, for most models, the training weights of the model.
- **LoRAs from CivitAI, and several LoRAs on one model (Image Setup).**
  - "Browse CivitAI" now offers "Add to library" for LoRAs. The download is checked against the size and the checksum of its listing.
  - Each LoRA is filed under the model family it was made for, so a model's LoRA picker lists the ones that fit it first. A LoRA from another family can still be attached and shows a warning.
  - A model's "LoRAs / speed" dialog is now a list: add as many as you want, each with its own weight. "Browse CivitAI" in that dialog opens on LoRAs that fit the model.
  - DoRA files, and LoRAs for model families LumaBrowser does not run, are refused.
- **Each chat can have its own image, image editor and video model.** The gear in the message box has a "Media models" section. A pick applies to that conversation only and is kept with it; "Default" follows Image Setup again.
  - **Roleplay (add-on 1.2.4):** the gear has the Image and Image editor rows too, and a Story section with Scene, Gallery, Create image, Clear story state and Edit everything. These used to be buttons under the message box.
  - A picture made with Create image shows under its reply as soon as it is done. It used to show only after the conversation was reopened.
- **Model pickers list every local model you have installed.** They used to list only the model that was loaded, so a feature could not be set to a different local model.
  - This covers the pickers in AI Chat, the Hub, agents, the chat side panel, the local provider card (Settings > AI & Providers) and the image, editor and video defaults.
  - A feature set to another local model than the loaded one loads its own model when it runs.
  - Two files of the same model are told apart by their file name.
- **A notice at startup when a chosen model is gone.** If the default chat model, the helper model, an image, editor, video or music default, a feature's model or an agent's model is no longer installed, a notification says so. Its "Choose a model" button opens the setting and highlights it.
  - The picker shows the missing choice as "Unavailable", so you can pick another model or go back to the default.
  - An agent whose model is gone runs on the app's default model until you choose another.
- **Agents can keep clicking until a page changes (`browser_click_until`).** One call clicks a link or button again and again until text or an element you name appears, or the address changes. It is meant for a step that only goes through some of the time, such as a queue or an item that keeps selling out.
  - The target is found by its visible label before every click, and a stop condition that is already true is refused.
  - If the page gets stuck and the target disappears, the page is loaded again. The loop ends on its own after 5 minutes unless you set another limit.
  - With `alert` on, LumaBrowser shows the tab, raises its window and posts a desktop notification when the loop ends.
- **Personal Hub: activity is filed by person, conversation and subject (Hub settings > Contexts).**
  - A contact can belong to a context ("Belongs to", under People > About). Their mail and direct messages are filed there, whichever app or mailbox they arrive in.
  - A context can name a conversation, for example a Slack channel. That channel is filed there even when the rest of its workspace belongs to another context.
  - A context can claim mail by its subject: list words under "Subject has".
  - Proton Mail notifications are read with their real sender and subject. They were all filed under one contact named "New email received". Duplicate contacts are merged once when you update, and what you recorded about them is kept.
  - Read and Open on a Slack item go to the channel the item came from, in the session it came from.
  - A summary takes your coming meetings into account, so a card asking for a meeting is rewritten once the meeting is booked.

### Changes
- **GPU headroom and model placement (LLM > Setup):**
  - A model that fits on one card only by using part of your GPU headroom may take up to half of it. It used to be spread over a second, slower card or moved partly to the CPU, which cost far more speed than the headroom was worth. The launch notes say when this happened.
  - When a model has to be split over cards of different speeds, the faster card keeps the last layers and the draft model. The split is faster and leaves the headroom you asked for.
  - The fit table in Setup plans with the free VRAM of the moment, your headroom and the cards a start would use, so it agrees with what Start does.
  - **A "Low VRAM warning" switch** (Chat defaults > More settings). The warning could only be dismissed per card and came back. Unloading on VRAM pressure keeps working with the warning off.
  - The launch notes no longer claim context retention for models that cannot use it (Qwen 3.5 and newer, DeepSeek V4 and a few others, and any model while its vision part is loaded). They say it is off and why.
  - With a RAM pin on, a large mixture-of-experts model loads at full speed when there is room in RAM. When there is not, the model is left unpinned and the RAM pin line says why.
- **The chat's instructions to the model were reworked.**
  - A chat with Tools off now knows today's date and follows your custom system prompt. It had neither.
  - With Tools on, the assistant answers a general question directly, and still uses a tool when you ask for one by name.
  - Models that call tools natively are no longer also told the text format for tool calls.
  - **Gemma 4** uses native tool calls and the sampler settings its makers recommend. It used to write some tool calls as plain text.
  - Charts in replies are drawn more reliably with smaller models.
- **A page the assistant opens in a new tab loads on the first try.** The tab could crash on its first navigation, and the assistant had to open the page a second time.
- **Notices in Settings:**
  - A failure is tinted, stays until you dismiss it, and can carry a button that takes you to the setting to fix.
  - The result of installing or updating an add-on shows on the add-on's own card. A failed install shows the reason and leaves the button for another try.
  - A failed JetBrains, VS Code or Windhawk install was shown as a success. It now shows as a failure.
  - A message raised while Settings is closed goes to the notification log. It used to be lost.
  - Rotating the desktop token waits for your answer. The token used to change before you had confirmed.
  - "Running" looks the same everywhere it is shown.
- **Personal Hub:**
  - Summaries and contact suggestions give the model more time to think, so they finish on slower models. A "Summarise now" that fails shows the error.
  - The Hub's tools answered with nothing when called by an agent connected over MCP. They return their results again.
- **The model compatibility test moved to an add-on, Model Testing.** Once it is installed, Setup has a "Model testing" tab under Developer: pick any downloaded model, pick the tests, and download the transcript of the last run. Your default model is put back after a run. Earlier results are kept. The starter card in chat and the entry in the search palette are gone from the app itself.
- **Code mode:** the "Editing" panel sits just above the bottom bar and no longer covers the plan or the message box.
- An add-on's settings page opened from a link or from the search palette stays open. It could close again a moment later.
- A paired PC's model picked in the AI Chat or Test Harness model picker is saved correctly.
- "Load more" in the model search dialogs is hidden when there are no more results.

## 2.2.3

### New features
- **A Downloads page (Ctrl+J).** Every download now has a page of its own. Open it with Ctrl+J, with Downloads in the main menu, or with "Show all downloads" at the bottom of the toolbar's downloads list.
  - Downloads are grouped by day, newest first, and the search box finds one by its name or its address.
  - Click a file's name to open it. Each row can also copy the download link, show the file in its folder, or be removed from the list, and a download in progress has a Cancel button.
  - "Clear all" removes the finished downloads from the list. The files stay on disk.
  - The toolbar's downloads list now shows the six most recent downloads, plus any that are still running.
  - The assistant's page tools cannot read or click this page, because its buttons open files on your computer.
- **Dictate into any app (Ctrl+Alt+Shift+D).** Press the shortcut in any program, speak, and press it again: what you said is typed where the cursor is. It works in LumaBrowser too.
  - It uses the speech recognition model on your computer, so nothing you say leaves it. Speech recognition has to be set up first: click the microphone in the chat once to install it.
  - A "Listening" notice shows while it records, with Done and Cancel.
  - If the text cannot be typed into the app, it is put on the clipboard.
  - Once speech recognition is set up, you can change the shortcut under Settings > General > Dictation.
- **Chrome extensions: toolbar badges, and password managers follow the tab you are on.**
  - The badge an extension sets now shows on its toolbar button, for example a password manager's count of logins for the page.
  - Extensions are told which tab is in front and when tabs open, load, switch and close, so a password manager offers the logins for the page you are on, also while its popup or the address bar has the keyboard.
  - An extension's popup and options page can use these too, along with right-click menu items and navigation events. They used to work from its background worker only.
- **AI agents can read and act on pages more precisely.** These apply to the browser tools in chat, over MCP and in the local API.
  - **Read one part of a page.** `browser_get_source`, `browser_observe_page` and `browser_screenshot` take a `selector`: read only the article, list only the controls of one form, or capture a single element at full size so small text stays readable.
  - `browser_get_source` offers `markdown` over MCP as well (headings, lists, tables and links kept), and `text` returns the visible text with the page's title.
  - `browser_extract_data` and `browser_collect_list` can read an attribute: end a field's selector with `@attribute`, as in `a.title@href` or `img@src`. A form field with no text reads as what it holds.
  - `browser_type` can type into a rich-text editor that lives in an iframe. `browser_observe_page` lists such an editor as `input:richtext`.
  - `luma docs tools` has a new "Working with pages" section on choosing a tab, reading and acting.

### Changes
- **The local API is closed to web pages and proxies that have no API key (Settings > API & MCP).**
  - Without an API key, the local API answers programs on this computer, devices your network setting allows, and LumaBrowser's own pages. A web page on any other site, or on another port of this computer, now needs a key.
  - A request that arrives through a reverse proxy or a tunnel needs a key too, unless network access is set to any address.
  - LumaBrowser's own pages no longer sign in with your first API key, so a web page open in a tab cannot borrow it. "Require an API key" now also works before you have created a key.
  - **If your API was open to any address with no API key, it now answers your local network only.** This is done once, when you update, and a notice tells you. Devices on your network keep working. To let others in, require an API key.
  - When a key is required, the MCP entry LumaBrowser writes for editors and agents carries it. An editor you connected before turning the requirement on has to be connected again (Settings > Editors & agents). An MCP client with a missing or wrong key now gets a message that says so, where it used to get an empty tool list.
- **WebDriver and CDP need an API key when they listen on the network.** Bound to 127.0.0.1 they work as before. On any other address they do not start until you have created an API key, and every client has to send it: Selenium as `http://luma:<key>@host:port`, CDP clients as an `Authorization: Bearer <key>` header or `?token=<key>` on the URL. Each server's settings tab says why it could not start.
- **Network Sharing:**
  - A new pairing PIN has to be 6 to 8 digits. A PIN you have already set keeps working.
  - Wrong PINs lock an address out for longer each time, up to an hour, and many wrong PINs in a short time pause pairing for everyone for a while.
  - A paired device's chats get the built-in tools: browsing, artifacts, images, video, music, web search and your knowledge base. The password manager, webhooks, extension tools and connected MCP servers are shared only once you tick them under Settings > Sharing, and a tool you switched off for your own chats is never shared.
  - An agent working for a paired device cannot open this computer's files, LumaBrowser's internal pages, or anything on this computer's own addresses. The web and other machines on your network still work.
- **The music server no longer listens on the network.** It accepts connections from this computer only. Under WSL it still listens inside the WSL machine, where Windows has to reach it.
- **Typing after a new tab, Ctrl+L, Alt+D or F6 goes to the address bar.** The cursor moved to the address bar, but the keys could keep going to the page. What you have typed, and the open suggestions, also stay when the new tab's first page finishes loading.
- **Background tabs opened by AI agents behave like real tabs.**
  - A silent tab had no size, so its page saw an empty window: nothing counted as in view and scrolling did nothing. It now has a normal-sized viewport.
  - A tab opened by a link in a silent tab is silent too. It used to appear in your tab strip and come to the front.
  - `browser_get_tabs` lists the tabs in your tab strip. `includeSilent` adds the agents' silent tabs, and the new `includeHidden` adds the tabs you keep running in the background, which `includeSilent` used to add as well.
  - The result of an action says whether a tab it opened is silent or visible to you, and tab lists no longer carry inline icon data.
- **The persisted tabs menu** shows each tab's icon and site under its title, grouped as "In the background" and "Open tabs".
- **The Luma Live tile keeps clear of the page's edge.** A tile parked in the corner of a large window sat flush against the edge once the window got smaller.
- **Tab Share:** the Share tab dialog shows the tab's title and its address on separate lines.

## 2.2.2

### New features
- **A terminal in the browser.** LumaBrowser now has a real terminal built in: PowerShell, Command Prompt, Git Bash and WSL on Windows, your login shell on macOS and Linux.
  - **As a tab:** press Ctrl+Shift+backtick, or choose "New terminal" in the main menu or the search palette. It sits in the tab strip like any page, shows the shell and the folder in its title, and reopens in the same folder when your tabs are restored.
  - **As a panel under the page:** press Ctrl+backtick or use the new toolbar button. The panel belongs to the tab it was opened under: it steps aside when you switch tabs and is still running when you come back. "Open in tab" moves it to a tab of its own without stopping anything in it.
  - **The shell keeps its usual keys.** Ctrl+R, Ctrl+W, Ctrl+L and the rest go to the shell. For the browser shortcuts on those keys, add Shift while you are in a terminal: Ctrl+Shift+T opens a tab, Ctrl+Shift+W closes one, Ctrl+Shift+L goes to the address bar, Ctrl+Shift+F finds and Ctrl+Shift+N opens a private window. Switching tabs, zoom and full screen work as usual.
  - **Command-line apps in one click:** Claude Code, Codex CLI, Gemini CLI, opencode, GitHub Copilot CLI, Aider and the Luma agent are offered as terminals when they are installed, and extensions can add their own.
  - **`luma` works on the page above it.** Started in a panel, the `luma` command takes the tab above the terminal as its working tab: "go to reddit.com" navigates that page.
  - **Default terminal** (Settings > Editors & agents > Terminal) picks the shell that new terminals start with.
- **The assistant can use the terminal, if you allow it (Settings > Editors & agents > Terminal > Let AI use the terminal).** Off by default. When it is on, the assistant, and AI tools connected through MCP or the local API (the `terminal_*` tools), can open a terminal, run commands, answer prompts and drive full-screen programs. The session stays open between steps and keeps its folder, variables and running programs.
  - **You can watch and take over.** Every terminal the assistant opens gets its own tab. You can type in it at any time, and **Take over** stops the assistant typing until you press **Hand back**.
  - **It asks first.** The assistant asks before it types. A command that only reads does not need a second question, a command that could delete or change things always asks, and forbidden commands are refused.
  - **It stays on your computer.** The terminal is never offered to people you share your models with.
- **Tab Share (add-on 1.1.0): Fit to my window.** A visitor with an interact link can press "Fit to my window" to size the shared tab to their own window, so a site opened from a phone lays out for the phone. Before, the visitor saw a scaled-down picture of your window.
  - Nothing is resized until a visitor presses the button, because it changes the tab for everyone watching. One visitor holds the size at a time (the last to press it). The tab goes back to its own size when they press the button again, leave, or you stop sharing.
  - Only the page is resized, never your LumaBrowser window, and the page does not grow past your own tab area.
  - **For a window tab (Windows), the app's window is resized to fit the visitor's screen** and put back the way it was afterwards.
  - The New Tab page and terminal tabs cannot be shared.
- **Personal Hub: tell it who people are (Hub settings > People > About).** Mark a contact as a person or as a general contact (a business or an organisation). For a person you can add how they relate to you and a birth date, with or without the year; for a general contact, what it is and a website. Both take further details such as a phone number or an address, and notes for the assistant.
  - **"Suggest from conversations"** has the Hub's model read what a contact has sent you and propose details, each shown with the message it comes from. Nothing is kept until you accept it, and a suggestion you dismiss is not made again.
  - **The assistant and the activity summaries use it.** They know who the people in your activity are, how old they are and when a birthday is coming up. You can also tell the assistant about someone in chat and it records it on the contact; what it only infers waits as a suggestion for you to accept.
  - In the Activity widget, a known person's name opens their contact and shows how they relate to you. The People search also finds a relation or a note.

### Changes
- **Network Sharing: an agent chat on a paired PC's model now runs the way it does on that PC itself.**
  - With no thinking level chosen, the host's own setting applies. The client's default used to replace it.
  - The reply length limit of an agent step now reaches the host.
  - Background calls (titles, summaries and other side calls) keep their own temperature, and an agent step follows the temperature set for the model on the host.
  - A picture requested at an exact size is rendered at that size on the host. The host used to change an edit to the model's native size.
- **Anima (add-on 1.0.1): pictures are clean again.** The step cache that was on by default made pictures soft and speckled on the current image runtimes, so it is now off. A render takes about twice as long.
- **"Run on startup" shows its real state (Windows).** With "Start hidden at login" on, which is the default, the switch showed off each time Settings was opened, although the app still started with the system.
- **Finished downloads are not announced again.** Downloads from earlier sessions raised their "Download finished" or "Download failed" notice again at every start and in each new window. They are now only listed.

## 2.2.1

### Changes
- **Roleplay (add-on 1.2.3):**
  - **A reply's world update shows when it arrives.** The world update, the activity line and the images of a reply are sent after the reply itself has finished, sometimes after the next turn has started, and the chat page dropped every one of them. They showed only once the conversation was reopened. They now appear under the reply they belong to, and an update for an earlier reply never lands on a newer one. Game mode's queued assets arrive the same way.
  - **A change made during play no longer erases the story record.** The page kept the copy of the story it had when the conversation was opened, and a gear setting, a removed turn, a scene picked from the scene menu or a redrawn or painted image saved that copy back whole. The events, the cast's states and the timeline points of every reply since were erased, and the narrator worked from a world several turns old until the story state was cleared. Each of these changes now starts from the story as stored.
  - **The model picked in the composer's gear or the model menu is the story's model from the next reply.** The pick changed the pill and nothing else: the story kept answering from the model chosen at setup.
  - Reopening a story right after a regeneration can no longer write an older copy over what the new reply saved.
- **Network Sharing: a chat mode played on a paired PC's model sends its whole request.** A roleplay played from a paired PC ran on the host with no reply cap (a reply that came apart generated until the host's context was full), without the story's samplers (DRY, min-p) or its thinking budget, and with every bookkeeping call at the model family's temperature in place of its own 0.2. All of these now reach the host.
  - **"Thinking off" is respected on a host's model.** The thinking setting was sent under names no server reads, so the host applied its own dial and a call that asked for no thinking reasoned anyway.
  - **The host's settings decide what you did not choose.** This PC's Setup default for thinking belongs to its own local server and is no longer sent for a host's model. With nothing chosen on the chat's thinking pill or in the model's Tune setting, the host's dial applies, and the pill's tooltip says so ("Nothing is chosen here, so the setting of the host applies.").
  - Where both sides name a setting: the reply cap is the smaller of the client's and the host's Tune cap, and the host's own Tune sampler and temperature for the model win over the client's, except for a bookkeeping call's fixed temperature. The context window and the launch settings are always the host's.
  - **Tools in a chat on a host's model are called in the text format.** The host's sharing endpoint takes no tool schemas, so the model was shown no tools and could call none. Measured on the wire; a full agent turn through a host has not been run yet. Not covered: a gpt-oss (Harmony) model on a host, which needs the schemas passed through.
  - A chat mode's reply cap is also sent to every other remote provider.
- **Roleplay Lab:**
  - `npm run rp:text -- --via-host` plays the story as a paired Network Sharing client does, through the app's own sharing handler on a loopback port, and reports which request fields arrived and which never crossed. Every Lab run used the local path before, so nothing a paired client does differently was exercised.
  - `npm run rp:state` has four more probes: deleting only the last reply, editing the last message, carrying on after a regeneration, and paging back to the first version of a regenerated reply. All pass without a model and on Qwen3.8-27B.

## 2.2.0

### New features
- **Web pages can use your local model (Settings > Privacy & permissions > Local model for web pages):** pages that call the browser's built-in AI (the web Prompt API: `LanguageModel.create()`, `prompt()`) are answered by your default chat model, on this computer. Off by default, since a page that may prompt the model uses your GPU.
  - **Each site asks first, like camera access:** Allow once, Always allow or Block, shown in the site's tab. The answer is remembered per site and listed under site permissions as "Local AI model", where it can be cleared. A blocked site is told no model is available, so it never learns it was refused.
  - Switching the setting off ends the Prompt API sessions pages have open. The switch is in the search palette as "Let web pages use your local model" (also found by "prompt api", "built-in ai", "window.ai" and "gemini nano").
  - Limits: text only (a picture or audio part is refused), a streamed prompt arrives as one chunk, `responseConstraint` is ignored, and a page sees a nominal 8,192 token window, not the loaded model's real one.
- **Triggers with memory keep their notes when the model forgets to save them.** A run is told to call `save_memory` before its final report, but a model told to "reply with X and nothing else" skipped it, so a prompt-mode trigger kept no notes at all. A run that succeeds without saving now gets one short follow-up call that writes the notes from what the run received and answered. It appears in the run's steps like the `save_memory` call it stands in for, and costs nothing for runs that saved their own.

### Changes
- **Electron 45** (was 43).
- **New tabs open faster.**
  - Web tabs now run in Chromium's sandbox, and a spare renderer is kept warm so a new tab does not wait for a process to start. On a local page a new tab finished loading in 63 ms before, 37 ms sandboxed, and 12 ms with the spare renderer.
  - The New Tab page is served by Chromium directly, with no request touching the app's main thread, so it opens just as fast while the app is busy.
  - Pop-up windows a page opens (sign-in popups) run in the same sandbox as their tab, so they keep their link to the page that opened them.
- **Saved passwords and secrets use the OS keychain's new interface.** The vault, trigger secrets (Slack signing secret, GitHub webhook secret, header token), Personal Hub tokens and Tool Forge config are decrypted once at startup and held in memory. A change applies at once and is written to the database in order, and quitting waits for a change made a moment before. The stored format is unchanged: data saved by an older build opens, and an older build can read what this one writes (verified on Windows).
  - A vault that has not finished opening reads as empty and refuses writes, so a list missing its items can never replace the stored one. A store that fails to open is logged and the app still starts.
- **A paste by the app puts your whole clipboard back.** Desktop control's paste and the hotkeys' selection actions borrow the clipboard and restore it afterwards. They used to restore text, HTML, RTF and images only, so copied files and app-private formats were lost. Every format is now kept, and something you copy in the meantime still wins.
- **An error while quitting no longer blocks the exit.** Services close while pages are still alive, and a late callback into a closed service raised an error box that held the app open. Such an error is now logged, and a page asking for a permission during shutdown is answered "not granted".
- **Windows:** the crash reporter now catches fast-fail terminations (the Windows Error Reporting helper that ships with Electron 45 is installed under the name Windows looks for).
- **Diagnostics:** the runtime trace covers the shell's renderer, the browser process and the GPU process; other tabs' renderers are no longer in it. The performance profiler's interaction trace is written as `runtime-trace.pftrace` (open it in ui.perfetto.dev). Electron 45 writes its own traces in that format only.
- A second copy of the app run with its own data folder (`LUMA_DATA_DIR`: a test or profiling run) no longer overwrites the installed app's desktop handshake file, which left desktop clients without a connection until the installed app next rewrote it.

## 2.1.9

### New features
- **Luma On Demand is now Luma Live, with a switch for its microphone (Settings > General > Luma in the browser):** the tile on web pages and its panel had two names, "Luma On Demand" and "the Live panel". Both are now Luma Live, in Settings, the search palette, the tile's tooltip and the assistant's own name. Searching "on demand" still finds it, and nothing stored changes.
  - **"Listen when Luma Live opens"** (on by default): the panel starts listening as soon as it opens, unless you last switched its microphone off there. Turn it off to always wait for a click on the microphone. A panel opened in a room where people are talking picked up that speech and sent it to the page as a command.
- **The placement canvas shows where each model is loaded, and can apply a saved layout (LLM > Advanced > Model placement):** a layout is read when a model loads, so saving one never moved a model that was already running, and nothing on screen said so. A chat model left on the smaller card ran at a seventh of its speed until every model was stopped by hand.
  - A "Saved, not applied yet" notice above the lanes lists each running model the saved layout puts somewhere else: where it is now and where the layout wants it. "Unload to apply" unloads only those models, and each loads in its saved place the next time it is used. Nothing is unloaded without that click, since an unload ends a reply or a render in progress.
  - A dashed "running here" mark (or "loading here", with "partly in RAM" for an offload) sits in the lane of each card a loaded model is on, when its chip is not already there. An automatic model's chip stays in the Automatic tray, so the canvas had no way to say which card it had landed on.
- **The Scheduled Task form creates the task without a second approval.** Pressing "Start task setup" is the go-ahead. The create step used to wait on an approval card inside the turn's step list, and a user who did not notice it within two minutes got no task and no clear reason. The form now says that starting setup creates the task, the create step stays open in the chat with what was made ("Created "name", runs every hour"), and the reply quotes the run prompt as stored.
  - This covers only that first create call. Changing a task, running it now, a setup that went through questions in chat and a task described by typing still ask.

### Changes
- **An image runtime too old for a model is skipped, or refused with a message that says to update it.** Installs fetch the latest release and nothing checked the version afterwards, so a LumaByte stable-diffusion.cpp install from before `luma-b4` was picked for MiniMax-H3-Image and failed with "get sd version from file failed". An old preferred runtime is now passed over for the configured one. When the old one is the runtime that would launch, the render stops before any loading with the build it needs and where to update it (Setup > Image > Image runtimes). A hand-built or PATH binary with no release tag is never blocked.
- **On a one-card PC, an image model that does not fit beside the chat model takes its place.** 2.1.8 added this for two cards. With one card the image model was loaded into whatever VRAM the chat model left. Its need is now weighed against the card's free room: if it does not fit, the chat model is stopped first and comes back on the next chat turn. A model that fits still loads beside it.
  - Choosing a GPU for the image model counts as placing it yourself, as choosing one for the chat model already did.
  - Saving a placement layout while the chat model is swapped out no longer brings it back beside the image model it made room for.
- **With one model as both the generation and the edit default, chat pictures use the generation slot.** They ran on the edit slot, so the Image Generate chip on the placement canvas decided nothing, and a layout that boxed chat, Image Generate and Video on one card did not swap the chat model out.
- **A failed image or video server is not retried by the model.** When the server itself fails (a model that will not load, a crash, a capacity error) the tool result now says that calling again this turn will not help and to tell the user what failed. A local chat model had called `generate_image` four times on one load failure. A request the model can correct (an unknown model, a text-to-video model asked to animate a picture) keeps its plain error.
- **The agent's live tab keeps its last frame when the card is not on screen.** A run that ended while its preview card was scrolled out of view, or while another tab was in front, left an empty box in the chat. The final frame is now captured in those cases too.
- **Background runs clean up their tabs.**
  - Tabs the model opened itself during a scheduled task, a trigger or any other run nobody is watching are closed when the run ends. Each scheduled run used to leave one in the tab strip. Tabs opened in an interactive chat turn stay.
  - Closing a background tab that was the last web tab no longer opens a New Tab and switches to it. The replacement tab is activated only when the tab you closed was the one in front.
- **The site info popup stays with the site it was opened on.** If the tab moves to another site while the popup is open (an agent or a script driving it), the popup closes, and a permission change, ad-block switch or "clear data" that arrives after the move is refused. A popup naming one site can no longer change another.
- **Chat defaults (LLM > Setup):**
  - The card saves only the control you changed. It used to send every control, so a card drawn before the chat's model picker changed the default model wrote the old model back on the next unrelated change, which also stopped the running server.
  - The card redraws when a default is changed elsewhere (the chat's model picker, a model switch by the router).
  - "Saved." appears beside the status pill. It was added at the top of the card, which pushed the controls down for four seconds and back on every change.
- **Model placement canvas:**
  - An opened system prompt preview stays open when the canvas redraws. It used to close, and the page jumped.
  - The Setup / Chat switch no longer covers the right end of Auto-arrange at window widths around 1250 px.
- **Numbered lists keep their numbers in chat.** A list with blank lines or a paragraph between its items was drawn as several lists that each started at 1, so the steps read 1, 1, 1.
- **Text-to-speech voices are no longer listed as chat models.** GGUF voices that an add-on downloads below the chat models folder were read by the chat model scan.
- **Network Sharing:**
  - A paired PC's helper model is not offered as a chat choice, and is not shared onward as this PC's own helper.
  - A paired PC's models are listed by name in the model picker, not by their internal reference.
  - In the web app on a phone, the chat list starts closed (it is a drawer there, and it opened over the composer on the first screen after pairing), and the composer's buttons wrap so Send stays on screen.
- **Game mode:**
  - The card's status chip follows the build: Building while a turn runs, then Ready, Needs fixing or Stopped. It read "Building" forever, while the game was played and shared.
  - The smoke test fails a game whose objects have NaN positions. Such a game boots, paints its backdrop and throws no error while nothing moves or is drawn (the usual cause is an `update` called without its frame time), and it used to come back clean with Play offered. The report says how many objects are affected and where to look.
  - The no-scrollbar rule from 2.1.8 is applied when a game is served, shared or exported as a zip, not written into the game's own page. Games made before 2.1.8, and games whose page the agent rewrote, did not have it. A game that is meant to scroll can still say so.
- **Site APIs:**
  - A run's result stays on screen. The page rebuilt itself after each run, which wiped the result within half a second. An open Run form (with its values and last result) or run history now survives the rebuild; a recompiled endpoint does not show its old result.
  - The builder is told to compile when it keeps reading. Asked for fields it could not reach, the builder model tried selector after selector and never compiled, until its 40 steps ran out. After four page reads in a row with no endpoint compiled it is told to compile with the fields that already extract, or to say which field cannot be extracted and why.
- **Tab Share:** a double click on "Create link" no longer closes the dialog. Done takes that button's place once the link exists, and now ignores clicks for the first 400 ms.
- Scheduled task steps have their own labels in chat ("Creating and testing the scheduled task…").
- The launch plan's reason for not using the locked RAM tier is correct when the RAM pin is on: it said the expert pool was bulk-read, where the pin already holds the whole model file in RAM.

