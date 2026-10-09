package com.lumabyte.luma.actions

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.actionSystem.ToggleAction
import com.intellij.openapi.options.ShowSettingsUtil
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.popup.JBPopupFactory
import com.intellij.openapi.ui.popup.PopupStep
import com.intellij.openapi.ui.popup.util.BaseListPopupStep
import com.intellij.openapi.wm.ToolWindowManager
import com.lumabyte.luma.bridge.LumaSession
import com.lumabyte.luma.ide.EditorContext
import com.lumabyte.luma.ide.LumaNotifications
import com.lumabyte.luma.settings.LumaConfigurable
import com.lumabyte.luma.settings.LumaSettings
import com.lumabyte.luma.ui.LumaToolWindowFactory

private fun showToolWindow(project: Project, focus: Boolean, then: () -> Unit = {}) {
    val tw = ToolWindowManager.getInstance(project).getToolWindow("Luma") ?: return then()
    if (focus) tw.activate(then, true, true) else { tw.show(then) }
}

class AskLumaAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        e.presentation.isEnabledAndVisible = e.project != null && (e.getData(CommonDataKeys.EDITOR) != null || e.place != "EditorPopup")
        val editor = e.getData(CommonDataKeys.EDITOR)
        e.presentation.text = if (editor != null && editor.selectionModel.hasSelection()) "Ask Luma About Selection" else "Ask Luma About This File"
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val session = LumaSession.of(project)
        val item = EditorContext.fromEvent(project, e, session.fileSync)
        if (item != null) session.addContext(item)
        showToolWindow(project, true) { LumaToolWindowFactory.view(project)?.focusInput() }
    }
}

class AddSelectionAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        val editor = e.getData(CommonDataKeys.EDITOR)
        e.presentation.isEnabledAndVisible = e.project != null && editor != null && editor.selectionModel.hasSelection()
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val session = LumaSession.of(project)
        val item = EditorContext.fromEvent(project, e, session.fileSync) ?: return
        session.addContext(item)
        showToolWindow(project, false)
    }
}

class AddFileAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY)
        e.presentation.isEnabledAndVisible = e.project != null && files != null && files.any { !it.isDirectory }
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val session = LumaSession.of(project)
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY) ?: return
        var added = 0
        for (f in files) {
            if (f.isDirectory) continue
            session.addContext(EditorContext.fromFile(f, session.fileSync))
            added++
        }
        if (added > 12) LumaNotifications.warn(project, "Luma", "Only the first 12 attached files reach the model per prompt.")
        showToolWindow(project, false)
    }
}

class NewSessionAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        LumaSession.of(project).newSession()
        showToolWindow(project, true) { LumaToolWindowFactory.view(project)?.focusInput() }
    }
}

class StopTurnAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.project?.let { LumaSession.of(it).streaming } == true
    }

    override fun actionPerformed(e: AnActionEvent) {
        e.project?.let { LumaSession.of(it).abort() }
    }
}

class OpenInAppAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.project?.let { LumaSession.of(it).status == LumaSession.Status.READY } == true
    }

    override fun actionPerformed(e: AnActionEvent) {
        e.project?.let { LumaSession.of(it).openInApp() }
    }
}

class ReconnectAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun actionPerformed(e: AnActionEvent) {
        e.project?.let { LumaSession.of(it).connect(startIfNeeded = true) }
    }
}

class OpenSettingsAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun actionPerformed(e: AnActionEvent) {
        ShowSettingsUtil.getInstance().showSettingsDialog(e.project, LumaConfigurable::class.java)
    }
}

class ToggleApprovalsAction : ToggleAction(), DumbAware {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun isSelected(e: AnActionEvent): Boolean = e.project?.let { LumaSession.of(it).approval != "never" } ?: true
    override fun setSelected(e: AnActionEvent, state: Boolean) {
        e.project?.let { LumaSession.of(it).setApproval(if (state) "ask" else "never") }
    }
}

class ToggleReasoningAction : ToggleAction(), DumbAware {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun isSelected(e: AnActionEvent): Boolean = LumaSettings.instance.state.showReasoning
    override fun setSelected(e: AnActionEvent, state: Boolean) {
        LumaSettings.instance.state.showReasoning = state
        e.project?.let { LumaToolWindowFactory.view(it)?.pushState() }
    }
}

class ChooseAgentAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT
    override fun update(e: AnActionEvent) {
        val s = e.project?.let { LumaSession.of(it) }
        e.presentation.isEnabled = s != null && s.status == LumaSession.Status.READY
        e.presentation.text = s?.agent?.name ?: "Agent"
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val session = LumaSession.of(project)
        session.requestAgents()
        val rows = listOf<LumaSession.AgentRow?>(null) + session.agents
        val step = object : BaseListPopupStep<LumaSession.AgentRow?>("Answer As", rows) {
            override fun getTextFor(value: LumaSession.AgentRow?): String =
                value?.let { "${it.name}${it.model?.let { m -> "  ·  $m" } ?: ""}" } ?: "Code (no agent)"

            override fun onChosen(selectedValue: LumaSession.AgentRow?, finalChoice: Boolean): PopupStep<*>? {
                session.switchAgent(selectedValue?.name)
                return PopupStep.FINAL_CHOICE
            }
        }
        val popup = JBPopupFactory.getInstance().createListPopup(step)
        val comp = e.inputEvent?.component
        if (comp != null) popup.showUnderneathOf(comp) else popup.showCenteredInCurrentWindow(project)
    }
}
