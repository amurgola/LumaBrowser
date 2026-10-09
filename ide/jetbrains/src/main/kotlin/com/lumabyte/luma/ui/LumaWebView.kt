package com.lumabyte.luma.ui

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.ide.BrowserUtil
import com.intellij.ide.ui.LafManagerListener
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.editor.colors.EditorColorsListener
import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.openapi.ide.CopyPasteManager
import com.intellij.openapi.options.ShowSettingsUtil
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import com.lumabyte.luma.bridge.LumaSession
import com.lumabyte.luma.ide.ContextItem
import com.lumabyte.luma.settings.LumaConfigurable
import com.lumabyte.luma.theme.IdeTheme
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefDisplayHandlerAdapter
import org.cef.handler.CefLoadHandlerAdapter
import java.awt.Cursor
import java.awt.datatransfer.StringSelection
import java.util.concurrent.ConcurrentLinkedQueue
import javax.swing.JComponent

class LumaWebView(private val project: Project, private val session: LumaSession) : Disposable, LumaSession.Listener {
    private val log = Logger.getInstance(LumaWebView::class.java)
    private val gson = Gson()
    private val browser: JBCefBrowser = JBCefBrowser.createBuilder().setOffScreenRendering(false).build()
    private val query = JBCefJSQuery.create(browser as JBCefBrowserBase)
    private val queue = ConcurrentLinkedQueue<String>()
    @Volatile private var pageReady = false
    private val url = "http://luma-ide/index.html"

    val component: JComponent get() = browser.component

    init {
        Disposer.register(this, browser)
        Disposer.register(this, query)
        query.addHandler { raw ->
            ApplicationManager.getApplication().invokeLater { handle(raw) }
            null
        }
        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(cefBrowser: CefBrowser?, frame: CefFrame?, httpStatusCode: Int) {
                if (frame == null || !frame.isMain) return
                cefBrowser?.executeJavaScript(
                    "window.__lumaSend = function(s){ ${query.inject("s")} };" +
                        "if (window.__luma) { window.__lumaSend(JSON.stringify({type:'ready',payload:{}})); }",
                    url, 0,
                )
            }
        }, browser.cefBrowser)
        browser.jbCefClient.addDisplayHandler(object : CefDisplayHandlerAdapter() {
            override fun onCursorChange(cefBrowser: CefBrowser?, cursorType: Int): Boolean {
                val cursor = awtCursor(cursorType)
                ApplicationManager.getApplication().invokeLater {
                    runCatching { browser.cefBrowser.uiComponent?.cursor = cursor }
                    browser.component.cursor = cursor
                }
                return true
            }
        }, browser.cefBrowser)
        val bus = ApplicationManager.getApplication().messageBus.connect(this)
        bus.subscribe(LafManagerListener.TOPIC, LafManagerListener { pushTheme() })
        bus.subscribe(EditorColorsManager.TOPIC, EditorColorsListener { pushTheme() })
        session.addListener(this)
        browser.loadHTML(buildHtml(), url)
    }

    private fun res(name: String): String =
        LumaWebView::class.java.getResourceAsStream("/webview/$name")?.use { String(it.readBytes(), Charsets.UTF_8) } ?: ""

    private fun buildHtml(): String {
        val css = res("luma.css")
        val app = res("app.js")
        val grammar = res("shared/tool-grammar.js")
        if (app.isBlank() || grammar.isBlank()) {
            log.warn("webview files are missing: build the plugin with scripts/build-jetbrains-plugin.js")
        }
        return res("index.html")
            .replace("/*@@CSS@@*/", css)
            .replace("/*@@SHARED_TOOL_GRAMMAR@@*/", grammar.replace("</script", "<\\/script"))
            .replace("/*@@APP_JS@@*/", app.replace("</script", "<\\/script"))
    }


    private fun dispatch(msg: JsonObject) {
        val js = "window.__luma && window.__luma.dispatch(${gson.toJson(msg)});"
        if (!pageReady) { queue.add(js); return }
        exec(js)
    }

    private fun exec(js: String) {
        try {
            browser.cefBrowser.executeJavaScript(js, url, 0)
        } catch (e: Exception) {
            log.info("executeJavaScript failed: ${e.message}")
        }
    }

    private fun flush() {
        while (true) { val js = queue.poll() ?: break; exec(js) }
    }

    fun pushTheme() {
        val vars = JsonObject()
        for ((k, v) in IdeTheme.cssVars()) vars.addProperty(k, v)
        dispatch(JsonObject().apply { addProperty("kind", "theme"); add("vars", vars) })
    }

    fun pushState() {
        dispatch(JsonObject().apply { addProperty("kind", "state"); add("state", session.stateJson()) })
    }

    fun focusInput() {
        dispatch(JsonObject().apply { addProperty("kind", "focus") })
        browser.component.requestFocusInWindow()
    }

    fun insertText(text: String) = dispatch(JsonObject().apply { addProperty("kind", "insertText"); addProperty("text", text) })
    fun sendPrompt(text: String) = dispatch(JsonObject().apply { addProperty("kind", "send"); addProperty("text", text) })
    fun note(text: String, level: String = "") = dispatch(JsonObject().apply { addProperty("kind", "note"); addProperty("text", text); addProperty("level", level) })

    override fun onState() { pushState() }

    override fun onFrame(type: String, payload: JsonElement) {
        if (type == "session:reset") { dispatch(JsonObject().apply { addProperty("kind", "reset") }); return }
        dispatch(JsonObject().apply { addProperty("kind", "frame"); addProperty("type", type); add("payload", payload) })
    }


    private fun handle(raw: String?) {
        val msg = try { JsonParser.parseString(raw ?: return).asJsonObject } catch (_: Exception) { return }
        val type = msg.get("type")?.takeIf { it.isJsonPrimitive }?.asString ?: return
        val p = msg.get("payload")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()
        when (type) {
            "ready" -> {
                pageReady = true
                pushTheme()
                pushState()
                flush()
                if (session.status == LumaSession.Status.OFFLINE) session.connect()
            }
            "prompt" -> {
                val text = p.get("text")?.asString ?: return
                val ids = p.getAsJsonArray("context")?.mapNotNull { it.asJsonObject.get("id")?.asString }?.toSet() ?: emptySet()
                val items: List<ContextItem> = session.context.filter { it.id in ids }
                session.prompt(text, items)
            }
            "followup" -> p.get("text")?.asString?.let { session.followup(it) }
            "approve" -> session.approve(p.get("decision")?.asString ?: "reject")
            "abort" -> session.abort()
            "bridge" -> {}
            "removeContext" -> p.get("id")?.asString?.let { session.removeContext(it) }
            "openFile" -> p.get("path")?.asString?.let { session.fileSync.openFile(session.root, it, p.get("line")?.takeIf { l -> l.isJsonPrimitive }?.asInt) }
            "showDiff" -> p.get("path")?.asString?.let { session.fileSync.showDiff(session.root, it) }
            "insert" -> p.get("text")?.asString?.let { session.fileSync.insertAtCaret(it) }
            "copy" -> p.get("text")?.asString?.let { CopyPasteManager.getInstance().setContents(StringSelection(it)) }
            "start" -> session.connect(startIfNeeded = true)
            "reconnect" -> session.connect(startIfNeeded = true)
            "settings" -> ShowSettingsUtil.getInstance().showSettingsDialog(project, LumaConfigurable::class.java)
            "openUrl" -> p.get("url")?.asString?.let { if (it.startsWith("http")) BrowserUtil.browse(it) }
            "turnEnded" -> {}
            else -> log.info("unknown page message: $type")
        }
    }

    override fun dispose() {
        session.removeListener(this)
    }

    companion object {
        private fun awtCursor(cefType: Int): Cursor = Cursor.getPredefinedCursor(
            when (cefType) {
                1 -> Cursor.CROSSHAIR_CURSOR
                2 -> Cursor.HAND_CURSOR
                3 -> Cursor.TEXT_CURSOR
                4, 34 -> Cursor.WAIT_CURSOR
                6, 15 -> Cursor.E_RESIZE_CURSOR
                7, 14 -> Cursor.N_RESIZE_CURSOR
                8, 16 -> Cursor.NE_RESIZE_CURSOR
                9, 17 -> Cursor.NW_RESIZE_CURSOR
                10 -> Cursor.S_RESIZE_CURSOR
                11 -> Cursor.SE_RESIZE_CURSOR
                12 -> Cursor.SW_RESIZE_CURSOR
                13 -> Cursor.W_RESIZE_CURSOR
                18 -> Cursor.E_RESIZE_CURSOR
                19 -> Cursor.N_RESIZE_CURSOR
                29, 41, 42 -> Cursor.MOVE_CURSOR
                30 -> Cursor.TEXT_CURSOR
                31 -> Cursor.CROSSHAIR_CURSOR
                else -> Cursor.DEFAULT_CURSOR
            },
        )
    }
}
