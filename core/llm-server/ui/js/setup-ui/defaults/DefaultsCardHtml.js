import FoldMemory from '../../setup/FoldMemory.js';
import DefaultsOptions from './DefaultsOptions.js';
import MoreSettingsChips from './MoreSettingsChips.js';

export default class DefaultsCardHtml {
  static HELP = {
    lockedModel: 'This runtime only loads its own model format, and one such model is installed, so the selection is fixed. Install another model of that format to get a choice here.',
    context: 'How much conversation the model can keep in view at once (<code>-c</code>, in tokens). The KV cache that backs it is sized up front, so bigger windows cost VRAM at launch; the GPU-fit matrix on each model row shows which sizes fit your hardware.',
    kv: 'Precision of the KV cache holding the context (<code>--cache-type-k/v</code>): f16 stores 2 bytes per element, q8_0 about half that. Keys and values are not equally sensitive: a key error changes which token attention finds, a value error only blurs what it reads back, which is why nothing here quantizes keys to 4 bits. A smaller cache buys a bigger usable context for some quality cost, and needs flash attention, which the launcher enables automatically where supported.',
    parallel: 'How many requests the server works on at once (<code>--parallel</code>). Values above 1 split the context window across slots, so each request gets a smaller share; leave it at 1 unless several chats or agents run at the same time.',
    thinking: 'How long a thinking model reasons before answering. Off skips the reasoning preamble entirely (Qwen3, DeepSeek-R1 and friends); the rest set a budget. Sent per request, so it is a per-task choice rather than something baked into the running server, and each chat can override it from the pill on its composer. Newer models can default to their longest setting, which is right for work you walk away from and slow for a quick question. Models with no reasoning mode ignore this.',
    approval: 'Risky tools are the ones that write files, send messages or webhooks, or create and delete scheduled work. With Always ask, the chat shows an approval card (Allow once / Allow for this run / Decline) before such a tool runs and declines it after two minutes of silence. Never ask lets every enabled tool run straight away. Auto asks in an interactive chat and runs unattended for scheduled tasks and API callers. Shell commands are classified before the card: read-only ones (ls, git status, grep) run without asking, recursive deletes and history rewrites always ask, and commands that would wreck the machine (rm -rf /, format, a download piped into a shell) are refused outright. Set <code>core.agent.shellClassifier</code> to false to turn that off.',
    flags: 'Anything you type here is split like a shell command line (double quotes keep a path with spaces together) and appended to the <code>llama-server</code> argv after every flag the launcher derived, so a flag you repeat here wins. Saved per model: switching the default model shows the flags stored for that model. Blank means no extra flags. The launch preview lists them under &quot;User flags appended&quot;.',
    tensorSplit: 'Uses <code>--split-mode tensor</code> instead of splitting by layer. Faster decode on a fully-resident dense model spread across two or more NVIDIA cards. Forces f16 KV cache and slows prompt processing.',
    cacheReuse: 'Passes <code>--cache-reuse 256</code>. Follow-up replies skip re-processing chat history, even after earlier turns are trimmed or edited. Not supported by every model architecture.',
    peerGpus: 'Distributed inference over <code>--rpc</code>: at server start the model splits across this machine and every attached peer. Attach a peer\'s GPUs in Settings &gt; Network Sharing.',
    ramPin: 'Locks the model files into physical memory for the whole session (Windows <code>VirtualLock</code>, Linux <code>mlock</code>), so every server start reads the weights at RAM speed instead of from disk. The launcher switches that start to <code>mmap</code>, which reads the very pages the pin holds: no second copy of the model in RAM. Pinned memory cannot be paged out, so the pin is refused when it would leave the system short on free RAM. Pins at app start, releases when the app closes.',
    groupRouter: 'Runs a 640&nbsp;MB model on the CPU next to the chat model. Before every Tools-on turn it reads your message and preloads the tool groups it needs (web search, images, video, music, artifacts, widgets, knowledge base, webhooks, tool forge), so the chat model has the full instructions for each tool on its first call. Adds about 0.1&nbsp;s per message and uses no VRAM. It can only add tools, so if it is slow or stopped the chat behaves exactly as it does with this off.',
    groupRouterPin: 'Locks the 640&nbsp;MB router model file into physical memory for the session, the same way RAM pin does for the chat model, so it never gets paged out and restarts read it at RAM speed. Only applies while Tool router is on.',
    vramPressure: 'While a model is loaded the app checks free VRAM on its cards every 5 seconds. When another app leaves a card under half of the reserve the launch planner held back, a banner warns you. With this on, a card that stays that low for 30 seconds while no request is running also unloads the model, so the other app gets its memory and the next chat reloads cleanly. Never interrupts a running generation.',
  };

  static html(rows, v) {
    const H = DefaultsCardHtml.HELP;
    return `
                ${rows.select('defaultRuntimeSelect', 'Runtime', v.runtimeOptions, '', !v.hasRuntime ? 'disabled' : '')}
                ${rows.select('defaultModelSelect', 'Model', v.modelOptions, v.lockModel ? H.lockedModel : '', (!v.hasModel || v.lockModel) ? 'disabled' : '')}
                ${rows.select('defaultContextSelect', 'Context length', DefaultsOptions.contextOptionsHtml(Number(v.defaults.contextSize) || null), H.context)}
                ${v.ready ? '' : '<div class="models-default-note" style="margin-top:10px;">Defaults gate the Chat surface. You need at least one installed runtime, one discovered model, and a selection in each dropdown.</div>'}
                <details class="setup-fold" data-fold-key="llm.more" ${FoldMemory.attr('llm.more')}>
                    <summary><span class="setup-fold-title">More settings</span><span class="setup-fold-meta">${MoreSettingsChips.html(v.defaults, v.prefs)}</span></summary>
                    <div class="setup-fold-body">
                        ${DefaultsCardHtml._moreRows(rows, v)}
                        <div class="defaults-opt-grid">
                            ${DefaultsCardHtml._toggles(rows, v)}
                        </div>
                    </div>
                </details>
                ${v.ready ? `<details class="setup-fold" data-fold-key="llm.gambit" ${FoldMemory.attr('llm.gambit')}>
                    <summary><span class="setup-fold-title">Compatibility gambit</span><span class="setup-fold-meta" id="gambitSummaryMeta">${v.gambitSummary}</span></summary>
                    <div class="setup-fold-body">${v.gambitBlock}</div>
                </details>` : ''}
            `;
  }

  static _moreRows(rows, v) {
    const H = DefaultsCardHtml.HELP;
    const d = v.defaults;
    const parallel = DefaultsOptions.parallelValue(d);
    return [
      rows.segmented('defaultKvSelect', 'KV cache precision', DefaultsOptions.KV, d.kvCacheType || '', H.kv),
      rows.segmented('defaultParallelSelect', 'Concurrent predictions', DefaultsOptions.parallelOptions(parallel), String(parallel), H.parallel),
      rows.segmented('defaultReasoningEffort', 'Thinking', DefaultsOptions.EFFORT, DefaultsOptions.effortPosition(d), H.thinking),
      v.prefs.approvalPolicy != null ? rows.segmented('defaultToolApproval', 'Tool approval', DefaultsOptions.APPROVAL, v.prefs.approvalPolicy, H.approval) : '',
      rows.text('defaultLaunchFlags', 'Extra llama.cpp flags', d.launchFlags || '', '--flash-attn on --n-gpu-layers 40', H.flags),
    ].join('\n                        ');
  }

  static _toggles(rows, v) {
    const H = DefaultsCardHtml.HELP;
    const d = v.defaults;
    const pinSupported = v.prefs.ramPinSupported();
    return [
      rows.toggle('defaultTensorSplit', 'Tensor split', !!d.tensorSplit, 'Split tensors across 2+ NVIDIA GPUs (experimental)', H.tensorSplit),
      rows.toggle('defaultCacheReuse', 'Context retention', !!d.cacheReuse, 'Keep conversation context reusable in server memory', H.cacheReuse),
      rows.toggle('defaultUsePeerGpus', 'Peer GPUs', !!d.usePeerGpus, 'Borrow GPUs from attached network peers <span id="peerGpusHint" class="defaults-caption-hint"></span>', H.peerGpus),
      pinSupported ? rows.toggle('defaultRamPin', 'RAM pin', !!d.pinModelRam, 'Keep the default model locked in RAM <span id="ramPinHint" class="defaults-caption-hint"></span>', H.ramPin) : '',
      v.routerAvailable ? rows.toggle('defaultGroupRouter', 'Tool router', !!d.groupRouter, 'Pick the tools for each message with a small helper model <span id="groupRouterHint" class="defaults-caption-hint"></span>', H.groupRouter) : '',
      (v.routerAvailable && pinSupported) ? rows.toggle('defaultGroupRouterPin', 'Router RAM pin', !!d.groupRouterPinRam, 'Keep the tool router model locked in RAM', H.groupRouterPin) : '',
      rows.toggle('defaultAutoUnload', 'Auto-unload', v.prefs.autoUnloadMs > 0, 'Stop the model after 15&nbsp;minutes idle (frees VRAM)', ''),
      v.prefs.unloadOnVramPressure !== null ? rows.toggle('defaultUnloadOnVramPressure', 'Unload on VRAM pressure', v.prefs.unloadOnVramPressure, 'Stop an idle model when its GPU stays critically short of free VRAM', H.vramPressure) : '',
    ].join('\n                            ');
  }
}
