package com.lumabyte.luma.vcs

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.Task
import com.intellij.openapi.project.DumbAwareAction
import com.intellij.openapi.project.Project
import com.intellij.openapi.vcs.VcsDataKeys
import com.intellij.vcs.commit.CommitMessageUi
import com.lumabyte.luma.bridge.LumaSession
import com.lumabyte.luma.ide.LumaNotifications
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

class GenerateCommitMessageAction : DumbAwareAction() {
    override fun getActionUpdateThread() = ActionUpdateThread.BGT

    override fun update(e: AnActionEvent) {
        val project = e.project
        val ui = e.getData(VcsDataKeys.COMMIT_WORKFLOW_UI)
        e.presentation.isVisible = ui != null
        e.presentation.isEnabled = ui != null && project != null && !inFlight.containsKey(project)
    }

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val ui = e.getData(VcsDataKeys.COMMIT_WORKFLOW_UI) ?: return
        if (inFlight.containsKey(project)) return
        val changes = ui.getIncludedChanges()
        val unversioned = ui.getIncludedUnversionedFiles()
        if (changes.isEmpty() && unversioned.isEmpty()) {
            LumaNotifications.warn(project, "Luma", "Tick the changes you want to commit first.")
            return
        }
        val messageUi = ui.commitMessageUi
        val typed = messageUi.text.trim()
        inFlight[project] = true
        loading(messageUi, true)

        object : Task.Backgroundable(project, "Luma: drafting a commit message", true) {
            private var draft: String? = null
            private var problem: String? = null

            override fun run(indicator: ProgressIndicator) {
                indicator.isIndeterminate = true
                indicator.text = "Reading the changes…"
                val bundle = CommitDiff.build(project, changes, unversioned, indicator)
                if (bundle.diff.isBlank()) { problem = "The selected changes have no content to describe."; return }

                val session = LumaSession.of(project)
                indicator.text = "Connecting to LumaBrowser…"
                indicator.text2 = ""
                if (!session.awaitReady(60_000) { indicator.isCanceled }) {
                    if (indicator.isCanceled) return
                    problem = session.statusMessage.ifBlank { "LumaBrowser is not running. Open the Luma tool window to start it." }
                    return
                }

                indicator.text = "Asking ${session.model ?: "the model"}…"
                val future = session.generateCommitMessage(bundle.diff, bundle.files, typed.takeIf { it.isNotEmpty() })
                while (true) {
                    try {
                        draft = future.get(200, TimeUnit.MILLISECONDS)
                        return
                    } catch (_: TimeoutException) {
                        if (indicator.isCanceled) { future.cancel(true); return }
                    } catch (e: ExecutionException) {
                        problem = e.cause?.message ?: "LumaBrowser could not draft a message."
                        return
                    } catch (_: InterruptedException) {
                        return
                    }
                }
            }

            override fun onSuccess() {
                val text = draft
                if (text != null) {
                    runCatching { messageUi.text = text; messageUi.focus() }
                } else {
                    problem?.let { LumaNotifications.warn(project, "Luma", it) }
                }
            }

            override fun onThrowable(error: Throwable) {
                LumaNotifications.warn(project, "Luma", error.message ?: "Could not draft a commit message.")
            }

            override fun onFinished() {
                inFlight.remove(project)
                loading(messageUi, false)
            }
        }.queue()
    }

    private fun loading(ui: CommitMessageUi, on: Boolean) {
        runCatching { if (on) ui.startLoading() else ui.stopLoading() }
    }

    companion object {
        private val inFlight = ConcurrentHashMap<Project, Boolean>()
    }
}
