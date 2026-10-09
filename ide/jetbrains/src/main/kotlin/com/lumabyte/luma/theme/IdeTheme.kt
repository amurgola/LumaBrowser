package com.lumabyte.luma.theme

import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.ui.JBColor
import com.intellij.util.ui.JBUI
import com.intellij.util.ui.UIUtil
import java.awt.Color

object IdeTheme {
    private fun hex(c: Color?): String? = c?.let { String.format("#%02x%02x%02x", it.red, it.green, it.blue) }

    fun cssVars(): Map<String, String> {
        val scheme = EditorColorsManager.getInstance().globalScheme
        val bg = UIUtil.getPanelBackground()
        val fg = UIUtil.getLabelForeground()
        val dark = !JBColor.isBright()
        val border = JBColor.border()
        val inputBg = UIUtil.getTextFieldBackground()
        val muted = UIUtil.getContextHelpForeground()
        val link = JBUI.CurrentTheme.Link.Foreground.ENABLED
        val selection = UIUtil.getListSelectionBackground(true)
        val hover = JBUI.CurrentTheme.List.Hover.background(true)
        val uiFont = UIUtil.getLabelFont()
        val editorFont = scheme.getFont(com.intellij.openapi.editor.colors.EditorFontType.PLAIN)
        val vars = linkedMapOf<String, String>()
        hex(bg)?.let { vars["--ide-bg"] = it }
        hex(fg)?.let { vars["--ide-fg"] = it }
        hex(border)?.let { vars["--ide-border"] = it }
        hex(scheme.defaultBackground)?.let { vars["--ide-editor-bg"] = it }
        hex(scheme.defaultForeground)?.let { vars["--ide-editor-fg"] = it }
        hex(inputBg)?.let { vars["--ide-input-bg"] = it }
        hex(muted)?.let { vars["--ide-muted"] = it }
        hex(link)?.let { vars["--ide-link"] = it }
        hex(selection)?.let { vars["--ide-selection"] = it }
        hex(hover)?.let { vars["--ide-hover"] = it }
        vars["--ide-font"] = "\"${uiFont.family}\", \"Segoe UI\", system-ui, sans-serif"
        vars["--ide-font-size"] = "${uiFont.size}px"
        vars["--ide-mono"] = "\"${editorFont.family}\", \"JetBrains Mono\", ui-monospace, Menlo, monospace"
        vars["--ide-mono-size"] = "${maxOf(10, editorFont.size - 1)}px"
        vars["--ide-dark"] = if (dark) "1" else "0"
        return vars
    }
}
