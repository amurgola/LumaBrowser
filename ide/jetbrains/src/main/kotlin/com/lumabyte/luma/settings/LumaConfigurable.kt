package com.lumabyte.luma.settings

import com.intellij.openapi.fileChooser.FileChooserDescriptorFactory
import com.intellij.openapi.options.BoundConfigurable
import com.intellij.openapi.ui.DialogPanel
import com.intellij.ui.dsl.builder.bindSelected
import com.intellij.ui.dsl.builder.bindText
import com.intellij.ui.dsl.builder.panel
import com.lumabyte.luma.bridge.AppLauncher

class LumaConfigurable : BoundConfigurable("LumaBrowser") {

    override fun createPanel(): DialogPanel {
        val s = LumaSettings.instance.state
        return panel {
            group("LumaBrowser") {
                row("Application:") {
                    textFieldWithBrowseButton(
                        FileChooserDescriptorFactory.createSingleFileOrExecutableAppDescriptor()
                            .withTitle("LumaBrowser Executable"),
                    )
                        .bindText({ s.appExecutable ?: "" }, { s.appExecutable = it.ifBlank { null } })
                        .comment(
                            AppLauncher.executable()?.let { "Detected: ${it.absolutePath}. Leave blank to keep auto-detection." }
                                ?: "Not detected. Point this at LumaBrowser.exe (or the .app / .AppImage) so the plugin can start it.",
                        )
                }
                row {
                    checkBox("Start LumaBrowser when the tool window opens and it is not running")
                        .bindSelected({ s.autoStart }, { s.autoStart = it })
                }
            }
            group("Agent") {
                row("Agent:") {
                    textField()
                        .bindText({ s.defaultAgent ?: "" }, { s.defaultAgent = it.ifBlank { null } })
                        .comment("Name of a LumaBrowser agent (Setup > Agents) to open sessions as. Blank = the plain Code agent.")
                }
                row {
                    checkBox("Ask before file edits and commands")
                        .bindSelected({ s.approval != "never" }, { s.approval = if (it) "ask" else "never" })
                        .comment("Off: the agent edits files and runs commands without asking (this IDE only). The LumaBrowser chat keeps its own setting.")
                }
                row {
                    checkBox("Show the model's reasoning while it streams")
                        .bindSelected({ s.showReasoning }, { s.showReasoning = it })
                }
                row {
                    checkBox("Suggest a follow-up after each answer (Tab accepts it)")
                        .bindSelected({ s.suggestFollowups }, { s.suggestFollowups = it })
                }
            }
            group("Editor") {
                row {
                    checkBox("Open files in the editor after the agent writes them")
                        .bindSelected({ s.openEditedFiles }, { s.openEditedFiles = it })
                }
                row {
                    checkBox("Show approval requests as notifications when the Luma tool window is hidden")
                        .bindSelected({ s.approvalBalloons }, { s.approvalBalloons = it })
                }
            }
        }
    }
}
