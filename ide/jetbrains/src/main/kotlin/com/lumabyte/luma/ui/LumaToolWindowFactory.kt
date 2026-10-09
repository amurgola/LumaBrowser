package com.lumabyte.luma.ui

import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.DialogPanel
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.dsl.builder.panel
import com.intellij.ui.jcef.JBCefApp
import com.intellij.util.ui.JBUI
import com.lumabyte.luma.bridge.LumaSession

class LumaToolWindowFactory : ToolWindowFactory, DumbAware {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val session = LumaSession.of(project)
        val component = try {
            if (JBCefApp.isSupported()) {
                val view = LumaWebView(project, session)
                Disposer.register(toolWindow.disposable, view)
                views[project] = view
                Disposer.register(toolWindow.disposable) { views.remove(project) }
                view.component
            } else {
                noJcefPanel()
            }
        } catch (e: LinkageError) {
            noJcefPanel()
        }
        val content = ContentFactory.getInstance().createContent(component, null, false)
        content.isCloseable = false
        toolWindow.contentManager.addContent(content)
        val am = ActionManager.getInstance()
        toolWindow.setTitleActions(listOf(am.getAction("LumaToolWindowTitle")))
        (am.getAction("LumaToolWindowGear") as? DefaultActionGroup)?.let { toolWindow.setAdditionalGearActions(it) }
    }

    private fun noJcefPanel(): DialogPanel = panel {
        row {
            text(
                "<html><b>The Luma tool window needs JCEF.</b><br><br>" +
                    "Your IDE runs on a Java runtime without the embedded browser (JCEF). Switch to a JetBrains Runtime with JCEF: " +
                    "<i>Help | Find Action | Choose Boot Java Runtime for the IDE</i>, pick a runtime whose name ends in <code>-jcef</code>, restart.<br><br>" +
                    "The <code>luma</code> terminal command works regardless.</html>",
            )
        }
    }.withBorder(JBUI.Borders.empty(12))

    companion object {
        val views = java.util.concurrent.ConcurrentHashMap<Project, LumaWebView>()
        fun view(project: Project): LumaWebView? = views[project]
    }
}
