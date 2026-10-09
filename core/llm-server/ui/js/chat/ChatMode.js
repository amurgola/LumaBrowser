import ChatContext from './ChatContext.js';
import ChatSubscriptions from './ChatSubscriptions.js';
import ChatShortcuts from './common/ChatShortcuts.js';
import PopoverCloser from './common/PopoverCloser.js';
import ShareLinks from './common/ShareLinks.js';
import Availability from './composer/Availability.js';
import AttachmentStrip from './composer/AttachmentStrip.js';
import ClipboardAttach from './composer/ClipboardAttach.js';
import ComposerCommands from './composer/ComposerCommands.js';
import ComposerView from './composer/ComposerView.js';
import DashboardContext from './composer/DashboardContext.js';
import DocsSourceContext from './composer/DocsSourceContext.js';
import GearPanel from './composer/GearPanel.js';
import GearToolList from './composer/GearToolList.js';
import ModelPicker from './composer/ModelPicker.js';
import TabContext from './composer/TabContext.js';
import ThinkPill from './composer/ThinkPill.js';
import UsageMeter from './composer/UsageMeter.js';
import ConversationMenu from './conversation/ConversationMenu.js';
import ConversationView from './conversation/ConversationView.js';
import LandingView from './conversation/LandingView.js';
import CodeBlockBar from './main/CodeBlockBar.js';
import FileDrop from './main/FileDrop.js';
import MainColumn from './main/MainColumn.js';
import CodeSurfaceReporter from './modes/CodeSurfaceReporter.js';
import ModeContext from './modes/ModeContext.js';
import ModeLauncher from './modes/ModeLauncher.js';
import ModePreflight from './modes/ModePreflight.js';
import ModeTheme from './modes/ModeTheme.js';
import ArtifactPanel from './panel/ArtifactPanel.js';
import MediaArtifactCache from './panel/MediaArtifactCache.js';
import PanelEditor from './panel/PanelEditor.js';
import ArtifactsSidebar from './sidebar/ArtifactsSidebar.js';
import ConversationList from './sidebar/ConversationList.js';
import Sidebar from './sidebar/Sidebar.js';
import SidebarFootAlignment from './sidebar/SidebarFootAlignment.js';
import SidebarModes from './sidebar/SidebarModes.js';
import ChatEventRouter from './stream/ChatEventRouter.js';
import StreamFinisher from './stream/StreamFinisher.js';
import StreamView from './stream/StreamView.js';
import TurnSender from './stream/TurnSender.js';
import ScheduledTaskMenu from './tasks/ScheduledTaskMenu.js';
import ScheduledTaskView from './tasks/ScheduledTaskView.js';
import TriggerMenu from './tasks/TriggerMenu.js';
import TriggerSections from './tasks/TriggerSections.js';
import TriggerView from './tasks/TriggerView.js';
import ArtifactChips from './turns/ArtifactChips.js';
import AssistantTurnEditor from './turns/AssistantTurnEditor.js';
import ErrorCard from './turns/ErrorCard.js';
import LiveArtifacts from './turns/LiveArtifacts.js';
import PreviewSlot from './turns/PreviewSlot.js';
import ReplyChoiceChips from './turns/ReplyChoiceChips.js';
import RuntimeFixCard from './turns/RuntimeFixCard.js';
import TabPreviewCard from './turns/TabPreviewCard.js';
import TableSort from './turns/TableSort.js';
import ThinkPane from './turns/ThinkPane.js';
import ToolChainView from './turns/ToolChainView.js';
import TurnActions from './turns/TurnActions.js';
import TurnRenderer from './turns/TurnRenderer.js';
import UserTurnEditor from './turns/UserTurnEditor.js';
import UserTurnView from './turns/UserTurnView.js';
import VoiceBridge from './voice/VoiceBridge.js';
import Dom from '../dom/Dom.js';
import ResonantRuntime from '../resonant/ResonantRuntime.js';

export default class ChatMode {
  static COMPONENTS = {
    popovers: PopoverCloser, shortcuts: ChatShortcuts, share: ShareLinks, mediaCache: MediaArtifactCache,
    sidebar: Sidebar, sideModes: SidebarModes, convList: ConversationList, artsSidebar: ArtifactsSidebar,
    footAlign: SidebarFootAlignment, main: MainColumn, codeBar: CodeBlockBar, fileDrop: FileDrop,
    panel: ArtifactPanel, panelEditor: PanelEditor,
    composer: ComposerView, availability: Availability, attachments: AttachmentStrip, paste: ClipboardAttach, tabs: TabContext, dashboard: DashboardContext,
    docs: DocsSourceContext, commands: ComposerCommands, thinkPill: ThinkPill,
    gear: GearPanel, gearTools: GearToolList, models: ModelPicker, usage: UsageMeter,
    turns: TurnRenderer, userTurns: UserTurnView, chain: ToolChainView, previewSlot: PreviewSlot,
    tabPreview: TabPreviewCard, artifactChips: ArtifactChips, liveArtifacts: LiveArtifacts, thinkPane: ThinkPane, tableSort: TableSort,
    runtimeFix: RuntimeFixCard, errorCard: ErrorCard, turnActions: TurnActions, turnEditor: AssistantTurnEditor, userEditor: UserTurnEditor,
    choiceChips: ReplyChoiceChips,
    voice: VoiceBridge, sender: TurnSender, stream: StreamView, events: ChatEventRouter, finisher: StreamFinisher,
    conversation: ConversationView, landing: LandingView, convMenu: ConversationMenu,
    tasks: ScheduledTaskView, taskMenu: ScheduledTaskMenu, triggers: TriggerView, triggerMenu: TriggerMenu,
    triggerSections: TriggerSections,
    modeCtx: ModeContext, launcher: ModeLauncher, preflight: ModePreflight, theme: ModeTheme, codeSurface: CodeSurfaceReporter,
    subscriptions: ChatSubscriptions,
  };

  constructor(collaborators) {
    this._ctx = new ChatContext(collaborators);
    for (const [name, Component] of Object.entries(ChatMode.COMPONENTS)) this._ctx[name] = new Component(this._ctx);
    this._built = false;
  }

  setCollaborators(partial) {
    this._ctx.setCollaborators(partial);
  }

  async mount(rootEl, api) {
    const ctx = this._ctx;
    ctx.api = api;
    ctx.root = rootEl;
    if (this._built) return;
    this._built = true;
    this._buildShell();
    await this._restoreSidebar();
    await ctx.subscriptions.install();
    await this._loadDebugFlag();
    ctx.share.refreshStatus();
    await this._loadModes();
    await ctx.docs.load();
    await ctx.models.refresh();
    await ctx.convList.refresh();
    ctx.thinkPill.load();
    ctx.landing.render();
    ctx.launcher.checkPendingIntent();
  }

  show() {
    const ctx = this._ctx;
    ctx.models.refresh().then(() => { if (!ctx.state.activeId) ctx.models.renderPill(); });
    ctx.convList.refresh();
    ctx.launcher.checkPendingIntent();
  }

  hide() {
    this._ctx.popovers.closeAll();
    this._ctx.codeBar.hide();
  }

  openTrigger(triggerId) {
    return this._ctx.triggers.open(triggerId);
  }

  openConversation(id) {
    return this._ctx.conversation.open(id);
  }

  addContext(item, focus) {
    this._ctx.attachments.addContext(item, focus);
  }

  activeConversationId() {
    return this._ctx.state.activeId || null;
  }

  _buildShell() {
    const ctx = this._ctx;
    const { els } = ctx;
    ctx.resonant = ResonantRuntime.scoped(ctx.root);
    els.sidebar = Dom.el('div', 'cm-sidebar');
    els.main = Dom.el('div', 'cm-main');
    els.panel = Dom.el('div', 'cm-artifact-panel');
    els.content = Dom.el('div', 'cm-content');
    els.stage = Dom.el('div', 'cm-stage');
    els.composerBar = Dom.el('div', 'cm-composer-bar');
    els.stage.appendChild(els.main);
    els.stage.appendChild(els.panel);
    els.content.appendChild(els.stage);
    els.content.appendChild(els.composerBar);
    ctx.root.appendChild(els.sidebar);
    ctx.root.appendChild(els.content);
    ctx.sidebar.build();
    ctx.main.build();
    ctx.panel.build();
    ctx.fileDrop.install();
    ctx.shortcuts.install();
    ctx.footAlign.install();
    ctx.stream.register();
  }

  async _restoreSidebar() {
    const ctx = this._ctx;
    try {
      ctx.state.sidebarExpanded = !(await ctx.api.getSidebarCollapsed());
    } catch (_) {
      ctx.state.sidebarExpanded = true;
    }
    ctx.sidebar.applyExpanded();
  }

  async _loadDebugFlag() {
    const ctx = this._ctx;
    try {
      const r = ctx.api.debug && await ctx.api.debug.getLogs();
      ctx.state.debugEnabled = !!(r && r.isDev);
    } catch (_) {}
  }

  async _loadModes() {
    const ctx = this._ctx;
    const ext = ctx.chatExt();
    try { if (ext && ext.load) await ext.load(ctx.api); } catch (_) {}
    ctx.state.modesReady = true;
    ctx.sideModes.render();
    ctx.convList.rebuild();
  }
}
