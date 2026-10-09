package com.lumabyte.luma.ui

import com.google.gson.JsonElement
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity
import com.intellij.openapi.wm.ToolWindowManager
import com.lumabyte.luma.bridge.LumaSession
import java.util.concurrent.atomic.AtomicBoolean

class LumaDevStartup : ProjectActivity {
    private val log = Logger.getInstance(LumaDevStartup::class.java)

    override suspend fun execute(project: Project) {
        if (System.getenv("LUMA_DEV_OPEN") != "1") return
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            ToolWindowManager.getInstance(project).getToolWindow("Luma")?.activate(null, true, true)
        }
        val prompt = System.getenv("LUMA_DEV_PROMPT")?.takeIf { it.isNotBlank() }
        val approve = System.getenv("LUMA_DEV_APPROVE")?.takeIf { it in setOf("once", "run", "reject") }
        if (prompt == null && approve == null) return
        val delay = System.getenv("LUMA_DEV_APPROVE_DELAY_MS")?.toLongOrNull() ?: 6000L
        val session = LumaSession.of(project)
        val sent = AtomicBoolean(false)
        session.addListener(object : LumaSession.Listener {
            override fun onState() {
                if (prompt != null && session.status == LumaSession.Status.READY && sent.compareAndSet(false, true)) {
                    log.info("dev: sending prompt")
                    ApplicationManager.getApplication().invokeLater {
                        LumaToolWindowFactory.view(project)?.sendPrompt(prompt)
                    }
                }
            }

            override fun onFrame(type: String, payload: JsonElement) {
                if (approve == null || type != "tool") return
                val phase = payload.takeIf { it.isJsonObject }?.asJsonObject?.get("phase")?.takeIf { it.isJsonPrimitive }?.asString
                if (phase != "approval") return
                log.info("dev: approval request, answering '$approve' in ${delay}ms")
                ApplicationManager.getApplication().executeOnPooledThread {
                    Thread.sleep(delay)
                    session.approve(approve)
                }
            }
        })
    }
}
