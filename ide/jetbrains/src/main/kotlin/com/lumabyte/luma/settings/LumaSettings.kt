package com.lumabyte.luma.settings

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.service

@Service(Service.Level.APP)
@State(name = "com.lumabyte.luma.settings", storages = [Storage("lumabrowser.xml")])
class LumaSettings : PersistentStateComponent<LumaSettings.State> {

    class State {
        var appExecutable: String? = null
        var autoStart: Boolean = true
        var approval: String = "ask"
        var openEditedFiles: Boolean = true
        var showReasoning: Boolean = false
        var suggestFollowups: Boolean = true
        var defaultAgent: String? = null
        var approvalBalloons: Boolean = true
    }

    private var current = State()

    override fun getState(): State = current
    override fun loadState(state: State) {
        current = state
    }

    companion object {
        val instance: LumaSettings get() = service<LumaSettings>()
    }
}
