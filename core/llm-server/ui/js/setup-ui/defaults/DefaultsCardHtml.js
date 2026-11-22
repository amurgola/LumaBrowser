import FoldMemory from '../../setup/FoldMemory.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import DefaultsOptions from './DefaultsOptions.js';
import MoreSettingsChips from './MoreSettingsChips.js';

export default class DefaultsCardHtml {
  static HELP = {
    openvinoDevice: 'Where the OpenVINO runtime runs the model (<code>GGML_OPENVINO_DEVICE</code>). Auto uses the Intel GPU, which is the fastest choice on every chip that has an NPU. NPU runs it on the Intel AI Boost unit of a Core Ultra chip: it uses less power but usually generates slower than the GPU beside it, handles one request at a time (Concurrent predictions is held at 1), works best with a small context (4K to 8K) and Q4_0 models, and some models fail on it. CPU runs on the processor through OpenVINO. Setting <code>GGML_OPENVINO_DEVICE</code> in your own environment overrides this.',
    context: 'How much conversation the model can keep in view at once (<code>-c</code>, in tokens). The KV cache that backs it is sized up front, so bigger windows cost VRAM at launch; the GPU-fit matrix on each model row shows which sizes fit your hardware.',
    kv: 'Precision of the KV cache holding the context (<code>--cache-type-k/v</code>): f16 stores 2 bytes per element, q8_0 about half that. Keys and values are not equally sensitive: a key error changes which token attention finds, a value error only blurs what it reads back, which is why nothing here quantizes keys to 4 bits. A smaller cache buys a bigger usable context for some quality cost, and needs flash attention, which the launcher enables automatically where supported.',
    parallel: 'How many requests the server works on at once (<code>--parallel</code>). Values above 1 split the context window across slots, so each request gets a smaller share; leave it at 1 unless several chats or agents run at the same time.',
    thinking: 'How long a thinking model reasons before answering. Off skips the reasoning preamble entirely (Qwen3, DeepSeek-R1 and friends); the rest set a budget. Sent per request, so it is a per-task choice rather than something baked into the running server, and each chat can override it from the pill on its composer. Newer models can default to their longest setting, which is right for work you walk away from and slow for a quick question. Models with no reasoning mode ignore this.',
    approval: 'Risky tools are the ones that write files, send messages or webhooks, or create and delete scheduled work. With Always ask, the chat shows an approval card (Allow once / Allow for this run / Decline) before such a tool runs and declines it after two minutes of silence. Never ask lets every enabled tool run straight away. Auto asks in an interactive chat and runs unattended for scheduled tasks and API callers. Shell commands are classified before the card: read-only ones (ls, git status, grep) run without asking, recursive deletes and history rewrites always ask, and commands that would wreck the machine (rm -rf /, format, a download piped into a shell) are refused outright. Set <code>core.agent.shellClassifier</code> to false to turn that off.',
    tune: 'Settings for this one model on top of these defaults: thinking, temperature, reply limit, KV cache and extra <code>llama-server</code> flags (split like a shell command line and appended after the launcher\'s own, so a flag repeated there wins). The same Tune button sits next to every model in the chat\'s model picker, which is also where a model\'s settings can be saved as a named profile.',
    tensorSplit: 'Uses <code>--split-mode tensor</code> instead of splitting by layer. Faster decode on a fully-resident dense model spread across two or more NVIDIA cards. Forces f16 KV cache and slows prompt processing.',
    cacheReuse: 'Passes <code>--cache-reuse 256</code>. Follow-up replies skip re-processing chat history, even after earlier turns are trimmed or edited. Left off for models that cannot use it (Qwen 3.5 and newer, DeepSeek V4) and while a vision projector is loaded; the launch notes say when.',
    peerGpus: 'Distributed inference over <code>--rpc</code>: at server start the model splits across this machine and every attached peer. Attach a peer\'s GPUs in Settings &gt; Network Sharing.',
    ramPin: 'Locks the model files into physical memory for the whole session (Windows <code>VirtualLock</code>, Linux <code>mlock</code>), so every server start reads the weights at RAM speed instead of from disk. The launcher switches that start to <code>mmap</code>, which reads the very pages the pin holds: no second copy of the model in RAM. The one exception is a mixture-of-experts model too big for the GPU, whose experts the GPU reads from RAM as it generates: mapped pages feed it at about half speed, so those experts are read into RAM a second time when there is room, and when there is not the model is not pinned at all (the caption says so). Pinned memory cannot be paged out, so the pin is also refused when it would leave the system short on free RAM. Pins at app start, releases when the app closes.',
    groupRouter: 'Runs a 640&nbsp;MB model on the CPU next to the chat model. Before every Tools-on turn it reads your message and preloads the tool groups it needs (web search, images, video, music, artifacts, widgets, knowledge base, webhooks, tool forge), so the chat model has the full instructions for each tool on its first call. Adds about 0.1&nbsp;s per message and uses no VRAM. It can only add tools, so if it is slow or stopped the chat behaves exactly as it does with this off.',
    groupRouterPin: 'Locks the 640&nbsp;MB router model file into physical memory for the session, the same way RAM pin does for the chat model, so it never gets paged out and restarts read it at RAM speed. Only applies while Tool router is on.',
    helperModel: 'Keeps a second, smaller chat model loaded in its own server for a mode\'s bookkeeping calls (the roleplay stage manager, casting and summaries), so those never take the main model\'s slot or evict its context cache. It stays loaded while this is on: nothing is swapped in and out per call. On a box with two cards it lands on the one the chat model is not using; with one card it shares it, so leave this off on a machine that cannot hold both. A mode only uses it when its setup asks for the helper; when it is off or still loading the mode uses the main model as before.',
    helperModelFile: 'A 4B to 12B instruct model from your library suits the bookkeeping calls: they need strict JSON and plain reasoning over a passage, not prose. The helper answers under a grammar, so its JSON always parses.',
    helperContext: 'The helper\'s own window. The stage call sends about 3k tokens; 8k is plenty and keeps its VRAM small.',
    moeGpuCache: 'When a mixture-of-experts model is too big for the GPU, every expert stays in system RAM and the spare VRAM becomes a cache of the experts used most recently (<code>--moe-cache-mib</code>); those run on the GPU and only cache misses cross PCIe. Measured on an RTX 5090 with a 111 GB model: roughly a third faster generation than filling the GPU with whole layers of experts, prompt processing about 13% slower. Output quality is unchanged. Needs a llama.cpp build from October 2026 or later (LumaByte luma-b4); older builds keep the layer fill. Applies at the next model load.',
    gpuHeadroom: 'How much VRAM a model load leaves free on each card, on top of what the desktop, other apps and other models already use there at load time. More headroom means fewer layers or experts on the GPU, so slower decode, but no slowdown when the desktop or a browser grows and no low-VRAM warnings. One exception: a model that fits whole on one card only by using half of the headroom still loads there, because moving layers to a slower card or the CPU costs far more speed; the plan notes say when that happened. Raise it for the card that drives your monitors. Applies at the next model load; the low-VRAM warning uses the same number.',
    vramPressure: 'While a model is loaded the app checks free VRAM on its cards every 5 seconds. A card that drops under the GPU headroom shows the low-VRAM warning. With this on, a card that stays under half of the headroom for 30 seconds while no request is running also unloads the model, so the other app gets its memory and the next chat reloads cleanly. Never interrupts a running generation.',
    vramWarning: 'The banner that says a card the model sits on has dropped under the GPU headroom (critical under half of it). Turn it off when you expect the pressure, for example a game or an image model sharing the card: nothing else changes, and Unload on VRAM pressure keeps working on its own.',
  };

  static html(rows, v) {
    const H = DefaultsCardHtml.HELP;
    return `
                ${rows.select('defaultModelSelect', 'Model', v.modelOptions, '', !v.hasModel ? 'disabled' : '')}
                ${DefaultsCardHtml.runsOnLine(v.runsOn)}
                ${rows.select('defaultContextSelect', 'Context length', DefaultsOptions.contextOptionsHtml(Number(v.defaults.contextSize) || null), H.context)}
                ${v.defaults.modelPath ? '' : '<div class="models-default-note" style="margin-top:10px;">Chat needs a default model. Pick one above.</div>'}
                <details class="setup-fold" data-fold-key="llm.more" ${FoldMemory.attr('llm.more')}>
                    <summary><span class="setup-fold-title">More settings</span><span class="setup-fold-meta">${MoreSettingsChips.html(v.defaults, v.prefs)}</span></summary>
                    <div class="setup-fold-body">
                        ${DefaultsCardHtml._moreRows(rows, v)}
                        <div class="defaults-opt-grid">
                            ${DefaultsCardHtml._toggles(rows, v)}
                        </div>
                    </div>
                </details>
            `;
  }

  static runsOnLine(runsOn) {
    if (!runsOn) return '';
    return `<div class="defaults-runs-on${runsOn.missing ? ' is-missing' : ''}" id="defaultsRunsOn">${HtmlEscaper.escape(runsOn.text)}</div>`;
  }

  static _moreRows(rows, v) {
    const H = DefaultsCardHtml.HELP;
    const d = v.defaults;
    return [
      rows.segmented('defaultReasoningEffort', 'Thinking', DefaultsOptions.EFFORT, DefaultsOptions.effortPosition(d), H.thinking),
      v.prefs.gpuHeadroomBytes != null ? rows.segmented('defaultGpuHeadroom', 'GPU headroom', DefaultsOptions.GPU_HEADROOM, DefaultsOptions.headroomPosition(v.prefs.gpuHeadroomBytes), H.gpuHeadroom) : '',
      v.prefs.approvalPolicy != null ? rows.segmented('defaultToolApproval', 'Tool approval', DefaultsOptions.APPROVAL, v.prefs.approvalPolicy, H.approval) : '',
      d.modelPath ? DefaultsCardHtml._tuneRow(rows, d, H.tune) : '',
      ...DefaultsCardHtml._helperRows(rows, v),
    ].join('\n                        ');
  }

  static _helperRows(rows, v) {
    const H = DefaultsCardHtml.HELP;
    const helper = v.defaults.helperModel;
    if (!v.helperAvailable || !helper) return [];
    const out = [rows.toggle('defaultHelperModel', 'Helper model', !!helper.enabled,
      'Keep a second, smaller model loaded for bookkeeping calls <span id="helperModelHint" class="defaults-caption-hint"></span>', H.helperModel)];
    if (helper.enabled) {
      out.push(rows.select('defaultHelperModelSelect', 'Helper model file', v.helperModelOptions, H.helperModelFile));
      out.push(rows.select('defaultHelperContext', 'Helper context', DefaultsOptions.contextOptionsHtml(Number(helper.contextSize) || null), H.helperContext));
    }
    return out;
  }

  static _tuneRow(rows, d, help) {
    const stem = String(d.modelPath).replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');
    const button = '<button type="button" class="luma-btn luma-btn--sm" data-tune-model="local::'
      + HtmlEscaper.escape(stem) + '">Tune this model…</button>';
    return rows.action('defaultTune', 'This model only', button, help);
  }

  static _toggles(rows, v) {
    const H = DefaultsCardHtml.HELP;
    const d = v.defaults;
    const pinSupported = v.prefs.ramPinSupported();
    return [
      v.routerAvailable ? rows.toggle('defaultGroupRouter', 'Tool router', !!d.groupRouter, 'Pick the tools for each message with a small helper model <span id="groupRouterHint" class="defaults-caption-hint"></span>', H.groupRouter) : '',
      (v.routerAvailable && pinSupported) ? rows.toggle('defaultGroupRouterPin', 'Router RAM pin', !!d.groupRouterPinRam, 'Keep the tool router model locked in RAM', H.groupRouterPin) : '',
      rows.toggle('defaultAutoUnload', 'Auto-unload', v.prefs.autoUnloadMs > 0, 'Stop the model after 15&nbsp;minutes idle (frees VRAM)', ''),
      v.prefs.vramWarning !== null ? rows.toggle('defaultVramWarning', 'Low VRAM warning', v.prefs.vramWarning, 'Show a banner when the model\'s GPU runs short of free VRAM', H.vramWarning) : '',
      v.prefs.unloadOnVramPressure !== null ? rows.toggle('defaultUnloadOnVramPressure', 'Unload on VRAM pressure', v.prefs.unloadOnVramPressure, 'Stop an idle model when its GPU stays critically short of free VRAM', H.vramPressure) : '',
    ].join('\n                            ');
  }
}
