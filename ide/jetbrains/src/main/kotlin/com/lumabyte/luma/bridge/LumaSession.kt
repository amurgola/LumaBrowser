package com.lumabyte.luma.bridge

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.intellij.notification.Notification
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationInfo
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import com.lumabyte.luma.ide.ContextItem
import com.lumabyte.luma.ide.EditorContext
import com.lumabyte.luma.ide.FileSync
import com.lumabyte.luma.ide.LumaNotifications
import com.lumabyte.luma.settings.LumaSettings
import java.util.UUID
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicInteger

@Service(Service.Level.PROJECT)
class LumaSession(val project: Project) : Disposable {
    enum class Status { OFFLINE, STARTING, CONNECTING, READY, ERROR }
    data class Agent(val id: String, val name: String)
    data class AgentRow(val id: String, val name: String, val description: String, val model: String?, val tools: Int)

    interface Listener {
        fun onState() {}
        fun onFrame(type: String, payload: JsonElement) {}
    }

    private val log = Logger.getInstance(LumaSession::class.java)
    private val gson = Gson()
    val fileSync = FileSync(project)

    @Volatile var status = Status.OFFLINE; private set
    @Volatile var statusMessage: String = ""; private set
    @Volatile var conversationId: String? = null; private set
    @Volatile var agent: Agent? = null; private set
    @Volatile var model: String? = null; private set
    @Volatile var root: String = project.basePath ?: ""; private set
    @Volatile var approval: String = LumaSettings.instance.state.approval; private set
    @Volatile var streaming = false; private set
    @Volatile var resumedMessages = 0; private set
    @Volatile var agents: List<AgentRow> = emptyList(); private set
    val context = CopyOnWriteArrayList<ContextItem>()

    private var client: BridgeClient? = null
    private var handshake: Handshake? = null
    private val listeners = CopyOnWriteArrayList<Listener>()
    private val connectSeq = AtomicInteger()
    private var pendingHelloAgent: String? = null
    private var pendingHelloResume: String? = null
    private var approvalBalloon: Notification? = null
    private var currentToolPath: String? = null
    private var currentTool: String? = null
    private val commitRequests = ConcurrentHashMap<String, CompletableFuture<String>>()

    fun addListener(l: Listener) { listeners.add(l) }
    fun removeListener(l: Listener) { listeners.remove(l) }

    private fun setState(block: () -> Unit) {
        block()
        for (l in listeners) try { l.onState() } catch (e: Exception) { log.warn("listener failed", e) }
    }

    private fun clientName(): String {
        val info = ApplicationInfo.getInstance()
        return "jetbrains/${info.versionName} ${info.fullVersion}".take(80)
    }


    fun connect(startIfNeeded: Boolean = LumaSettings.instance.state.autoStart, resume: String? = conversationId, agentName: String? = agent?.name ?: LumaSettings.instance.state.defaultAgent) {
        val seq = connectSeq.incrementAndGet()
        disconnectClient()
        setState { status = Status.CONNECTING; statusMessage = "" }
        ApplicationManager.getApplication().executeOnPooledThread {
            try {
                val read = Handshake.read()
                var hs = read?.takeIf { Handshake.healthy(it) }
                log.info("handshake ${Handshake.file}: ${if (read == null) "absent or unreadable" else "port ${read.port}, app ${read.version ?: "?"}"}; healthy=${hs != null}")
                if (hs == null) {
                    if (!startIfNeeded) throw IllegalStateException("LumaBrowser is not running.")
                    setState { status = Status.STARTING; statusMessage = "Starting LumaBrowser…" }
                    hs = AppLauncher.startAndWait { msg -> setState { statusMessage = msg } }
                }
                if (seq != connectSeq.get()) return@executeOnPooledThread
                setState { status = Status.CONNECTING; statusMessage = "Connecting…" }
                val c = BridgeClient(hs, ::onFrame) { reason -> onClosed(seq, reason) }
                c.connect()
                log.info("bridge connected on port ${hs.port}")
                if (seq != connectSeq.get()) { c.close(); return@executeOnPooledThread }
                client = c
                handshake = hs
                hello(agentName, resume)
            } catch (e: Exception) {
                if (seq != connectSeq.get()) return@executeOnPooledThread
                log.info("connect failed: ${e.message}")
                setState { status = Status.ERROR; statusMessage = e.message ?: "connection failed"; streaming = false }
            }
        }
    }

    private fun onClosed(seq: Int, reason: String?) {
        if (seq != connectSeq.get()) return
        client = null
        failCommitRequests("The connection to LumaBrowser dropped.")
        setState {
            status = Status.OFFLINE
            statusMessage = if (streaming) "The connection to LumaBrowser dropped mid-turn." else (reason?.takeIf { it != "bye" } ?: "")
            streaming = false
        }
    }

    private fun disconnectClient() {
        val c = client ?: return
        client = null
        c.close()
        failCommitRequests("Disconnected from LumaBrowser.")
    }

    fun awaitReady(timeoutMs: Long, cancelled: () -> Boolean = { false }): Boolean {
        if (status == Status.READY && client != null) return true
        if (status != Status.CONNECTING && status != Status.STARTING) connect(startIfNeeded = true)
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            if (cancelled()) return false
            when (status) {
                Status.READY -> return client != null
                Status.ERROR, Status.OFFLINE -> return false
                else -> Thread.sleep(100)
            }
        }
        return false
    }

    fun disconnect() {
        connectSeq.incrementAndGet()
        disconnectClient()
        setState { status = Status.OFFLINE; statusMessage = ""; streaming = false }
    }

    private fun hello(agentName: String?, resume: String?) {
        pendingHelloAgent = agentName
        pendingHelloResume = resume
        val p = JsonObject()
        p.addProperty("cwd", root)
        if (!agentName.isNullOrBlank()) p.addProperty("agent", agentName) else p.add("agent", JsonNull.INSTANCE)
        if (!resume.isNullOrBlank()) p.addProperty("conversationId", resume) else p.add("conversationId", JsonNull.INSTANCE)
        p.addProperty("approval", approval)
        p.addProperty("suggest", LumaSettings.instance.state.suggestFollowups)
        p.addProperty("origin", "ide")
        p.addProperty("client", clientName())
        client?.send("hello", p)
    }

    private fun startedFresh() {
        streaming = false
        conversationId = null
        resumedMessages = 0
        for (l in listeners) l.onFrame("session:reset", JsonNull.INSTANCE)
        LumaNotifications.warn(project, "Luma", "The previous conversation was deleted in LumaBrowser. Started a new one.")
    }

    fun newSession(agentName: String? = agent?.name) {
        streaming = false
        conversationId = null
        resumedMessages = 0
        for (l in listeners) l.onFrame("session:reset", JsonNull.INSTANCE)
        if (client == null || status != Status.READY) { connect(resume = null, agentName = agentName); return }
        hello(agentName, null)
    }

    fun switchAgent(agentName: String?) = newSession(agentName)

    fun setApproval(mode: String) {
        approval = if (mode == "never") "never" else "ask"
        LumaSettings.instance.state.approval = approval
        if (client != null && status == Status.READY && !streaming) hello(agent?.name, conversationId)
        setState { }
    }


    fun prompt(text: String, items: List<ContextItem>) {
        if (text.isBlank() || client == null) return
        val p = JsonObject()
        p.addProperty("text", text)
        if (items.isNotEmpty()) {
            val arr = JsonArray()
            for (it in items) {
                val o = JsonObject()
                o.addProperty("path", it.path)
                it.startLine?.let { n -> o.addProperty("startLine", n) }
                it.endLine?.let { n -> o.addProperty("endLine", n) }
                o.addProperty("kind", it.kind)
                EditorContext.readText(it)?.let { t -> o.addProperty("text", t) }
                arr.add(o)
            }
            p.add("context", arr)
        }
        setState { streaming = true }
        client?.send("prompt", p)
        context.removeAll(items.toSet())
    }

    fun followup(text: String) {
        val p = JsonObject(); p.addProperty("text", text)
        client?.send("followup", p)
    }

    fun approve(decision: String) {
        val p = JsonObject(); p.addProperty("decision", decision)
        client?.send("approve", p)
        expireBalloon()
    }

    fun abort() { client?.send("abort", JsonObject()) }
    fun requestAgents() { client?.send("list-agents", JsonObject()) }
    fun openInApp() { if (client == null) connect() else client?.send("open-in-app", JsonObject()) }

    fun generateCommitMessage(diff: String, files: List<Pair<String, String>>, hint: String?): CompletableFuture<String> {
        val future = CompletableFuture<String>()
        val c = client
        if (c == null || status != Status.READY) {
            future.completeExceptionally(IllegalStateException("LumaBrowser is not connected."))
            return future
        }
        val id = UUID.randomUUID().toString()
        commitRequests[id] = future
        val p = JsonObject()
        p.addProperty("requestId", id)
        p.addProperty("diff", diff)
        p.addProperty("cwd", root)
        if (!hint.isNullOrBlank()) p.addProperty("hint", hint)
        val arr = JsonArray()
        for ((path, status) in files) arr.add(JsonObject().apply { addProperty("path", path); addProperty("status", status) })
        p.add("files", arr)
        if (!c.send("commit-message", p)) {
            commitRequests.remove(id)
            future.completeExceptionally(IllegalStateException("Could not reach LumaBrowser."))
        }
        return future
    }

    private fun failCommitRequests(reason: String) {
        if (commitRequests.isEmpty()) return
        val pending = commitRequests.values.toList()
        commitRequests.clear()
        for (f in pending) f.completeExceptionally(IllegalStateException(reason))
    }


    fun addContext(item: ContextItem) {
        context.removeIf { it.path == item.path && it.startLine == item.startLine && it.endLine == item.endLine }
        context.add(item)
        setState { }
    }

    fun removeContext(id: String) { context.removeIf { it.id == id }; setState { } }
    fun clearContext() { context.clear(); setState { } }


    private fun onFrame(type: String, payload: JsonElement) {
        val p = payload.takeIf { it.isJsonObject }?.asJsonObject
        when (type) {
            "ready" -> {
                if (p?.get("resumeMissed")?.isJsonObject == true) startedFresh()
                setState {
                    status = Status.READY
                    statusMessage = ""
                    conversationId = p?.get("conversationId")?.takeIf { it.isJsonPrimitive }?.asString
                    val a = p?.get("agent")?.takeIf { it.isJsonObject }?.asJsonObject
                    agent = a?.let { Agent(it.get("id").asString, it.get("name").asString) }
                    model = p?.get("model")?.takeIf { it.isJsonPrimitive }?.asString
                    root = p?.get("root")?.takeIf { it.isJsonPrimitive }?.asString ?: root
                    resumedMessages = p?.get("resumedMessages")?.takeIf { it.isJsonPrimitive }?.asInt ?: 0
                    approval = p?.get("approval")?.takeIf { it.isJsonPrimitive }?.asString ?: approval
                }
                requestAgents()
            }
            "agents" -> {
                val rows = p?.getAsJsonArray("agents")?.mapNotNull { e ->
                    val o = e.asJsonObject
                    AgentRow(
                        o.get("id")?.asString ?: return@mapNotNull null,
                        o.get("name")?.asString ?: return@mapNotNull null,
                        o.get("description")?.takeIf { it.isJsonPrimitive }?.asString ?: "",
                        o.get("model")?.takeIf { it.isJsonPrimitive }?.asString,
                        o.get("tools")?.takeIf { it.isJsonPrimitive }?.asInt ?: 0,
                    )
                } ?: emptyList()
                setState { agents = rows }
            }
            "bridge-error" -> {
                val code = p?.get("code")?.takeIf { it.isJsonPrimitive }?.asString
                val msg = p?.get("message")?.takeIf { it.isJsonPrimitive }?.asString ?: "bridge error"
                if ((code == "no-conversation" || code == "not-code") && !pendingHelloResume.isNullOrBlank()) {
                    startedFresh()
                    hello(pendingHelloAgent, null)
                    return
                }
                if (status != Status.READY) {
                    if (code == "no-agent" && !pendingHelloAgent.isNullOrBlank()) {
                        LumaNotifications.warn(project, "Luma", "No LumaBrowser agent named \"$pendingHelloAgent\"; using the Code agent.")
                        hello(null, null)
                        return
                    }
                    setState { status = Status.ERROR; statusMessage = msg }
                } else if (streaming) {
                    setState { streaming = false }
                }
            }
            "commit-message-result" -> {
                val id = p?.get("requestId")?.takeIf { it.isJsonPrimitive }?.asString
                val f = id?.let { commitRequests.remove(it) }
                if (f != null) {
                    val ok = p.get("ok")?.takeIf { it.isJsonPrimitive }?.asBoolean ?: false
                    val text = p.get("text")?.takeIf { it.isJsonPrimitive }?.asString
                    if (ok && !text.isNullOrBlank()) f.complete(text)
                    else f.completeExceptionally(IllegalStateException(p.get("message")?.takeIf { it.isJsonPrimitive }?.asString ?: "LumaBrowser returned no draft."))
                }
            }
            "meta" -> p?.get("conversationId")?.takeIf { it.isJsonPrimitive }?.asString?.let { conversationId = it }
            "followup-start" -> setState { streaming = true }
            "done", "error", "busy" -> { expireBalloon(); setState { streaming = false } }
            "tool" -> onTool(p)
            else -> {}
        }
        for (l in listeners) try { l.onFrame(type, payload) } catch (e: Exception) { log.warn("listener failed", e) }
    }

    private fun onTool(p: JsonObject?) {
        val phase = p?.get("phase")?.takeIf { it.isJsonPrimitive }?.asString ?: return
        val tool = p.get("tool")?.takeIf { it.isJsonPrimitive }?.asString ?: ""
        val params = p.get("params")?.takeIf { it.isJsonObject }?.asJsonObject
        val path = params?.get("path")?.takeIf { it.isJsonPrimitive }?.asString
        when (phase) {
            "run" -> {
                currentTool = tool
                currentToolPath = path
                if (path != null && (tool == "write_file" || tool == "edit_file")) fileSync.snapshot(root, path)
            }
            "done", "result" -> {
                val ok = p.get("success")?.takeIf { it.isJsonPrimitive }?.asBoolean ?: true
                val cp = currentToolPath
                if (ok && cp != null && (currentTool == "write_file" || currentTool == "edit_file")) {
                    fileSync.afterWrite(root, cp, LumaSettings.instance.state.openEditedFiles)
                }
                currentTool = null
                currentToolPath = null
            }
            "approval" -> {
                if (!LumaSettings.instance.state.approvalBalloons) return
                ApplicationManager.getApplication().invokeLater {
                    if (project.isDisposed) return@invokeLater
                    val tw = ToolWindowManager.getInstance(project).getToolWindow("Luma")
                    val visible = tw != null && tw.isVisible && tw.isActive
                    if (visible) return@invokeLater
                    val detail = p.get("detail")?.takeIf { it.isJsonPrimitive }?.asString ?: path ?: tool
                    expireBalloon()
                    approvalBalloon = LumaNotifications.approval(project, tool.replace('_', ' '), detail) { d -> approve(d) }
                }
            }
            "approval-done" -> expireBalloon()
        }
    }

    private fun expireBalloon() {
        val b = approvalBalloon ?: return
        approvalBalloon = null
        ApplicationManager.getApplication().invokeLater { b.expire() }
    }

    fun stateJson(): JsonObject {
        val o = JsonObject()
        o.addProperty("status", status.name.lowercase())
        o.addProperty("statusMessage", statusMessage)
        o.add("agent", agent?.let { a -> JsonObject().apply { addProperty("id", a.id); addProperty("name", a.name) } } ?: JsonNull.INSTANCE)
        o.addProperty("model", model)
        o.addProperty("root", root)
        o.addProperty("approval", approval)
        o.addProperty("streaming", streaming)
        o.addProperty("resumedMessages", resumedMessages)
        o.addProperty("conversationId", conversationId)
        o.addProperty("showReasoning", LumaSettings.instance.state.showReasoning)
        o.addProperty("suggest", LumaSettings.instance.state.suggestFollowups)
        o.addProperty("ideName", ApplicationInfo.getInstance().versionName)
        val ctx = JsonArray()
        for (c in context) {
            val i = JsonObject()
            i.addProperty("id", c.id); i.addProperty("kind", c.kind); i.addProperty("path", c.path)
            c.startLine?.let { i.addProperty("startLine", it) }
            c.endLine?.let { i.addProperty("endLine", it) }
            ctx.add(i)
        }
        o.add("context", ctx)
        return o
    }

    override fun dispose() {
        connectSeq.incrementAndGet()
        disconnectClient()
        failCommitRequests("The project was closed.")
        listeners.clear()
    }

    companion object {
        fun of(project: Project): LumaSession = project.getService(LumaSession::class.java)
    }
}
