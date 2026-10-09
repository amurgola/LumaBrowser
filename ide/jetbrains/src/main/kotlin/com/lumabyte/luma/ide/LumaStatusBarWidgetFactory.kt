package com.lumabyte.luma.ide

import com.google.gson.JsonElement
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.StatusBarWidgetFactory
import com.intellij.openapi.wm.ToolWindowManager
import com.intellij.openapi.wm.WindowManager
import com.intellij.util.Consumer
import com.lumabyte.luma.bridge.LumaSession
import java.awt.Component
import java.awt.event.MouseEvent

class LumaStatusBarWidgetFactory : StatusBarWidgetFactory {
    override fun getId(): String = ID
    override fun getDisplayName(): String = "LumaBrowser"
    override fun isAvailable(project: Project): Boolean = true
    override fun createWidget(project: Project): StatusBarWidget = LumaStatusWidget(project)
    override fun canBeEnabledOn(statusBar: StatusBar): Boolean = true

    companion object {
        const val ID = "LumaStatus"
    }
}

class LumaStatusWidget(private val project: Project) : StatusBarWidget, StatusBarWidget.TextPresentation, LumaSession.Listener {
    private var statusBar: StatusBar? = null
    private val session = LumaSession.of(project)

    init {
        session.addListener(this)
    }

    override fun ID(): String = LumaStatusBarWidgetFactory.ID
    override fun getPresentation(): StatusBarWidget.WidgetPresentation = this

    override fun install(statusBar: StatusBar) {
        this.statusBar = statusBar
    }

    override fun dispose() {
        session.removeListener(this)
        statusBar = null
    }

    override fun onState() {
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            (statusBar ?: WindowManager.getInstance().getStatusBar(project))?.updateWidget(ID())
        }
    }

    override fun onFrame(type: String, payload: JsonElement) {}

    override fun getText(): String {
        val s = session
        return when (s.status) {
            LumaSession.Status.READY -> "Luma: " + (if (s.streaming) "working" else (s.model?.substringAfterLast("::")?.take(28) ?: "ready"))
            LumaSession.Status.STARTING -> "Luma: starting…"
            LumaSession.Status.CONNECTING -> "Luma: connecting…"
            LumaSession.Status.ERROR -> "Luma: offline"
            LumaSession.Status.OFFLINE -> "Luma"
        }
    }

    override fun getAlignment(): Float = Component.CENTER_ALIGNMENT

    override fun getTooltipText(): String = when (session.status) {
        LumaSession.Status.READY -> "LumaBrowser connected" + (session.agent?.let { " · agent ${it.name}" } ?: "") + (session.model?.let { " · $it" } ?: "")
        LumaSession.Status.ERROR -> session.statusMessage.ifBlank { "LumaBrowser is not reachable" }
        else -> "LumaBrowser"
    }

    override fun getClickConsumer(): Consumer<MouseEvent> = Consumer {
        ToolWindowManager.getInstance(project).getToolWindow("Luma")?.activate(null)
    }
}
