package com.lumabyte.luma.ide

import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import java.util.UUID

data class ContextItem(
    val id: String = UUID.randomUUID().toString(),
    val kind: String,
    val path: String,
    val absPath: String,
    val startLine: Int? = null,
    val endLine: Int? = null,
    val text: String? = null,
)

object EditorContext {
    private const val MAX_SELECTION_CHARS = 24_000
    private const val MAX_FILE_CHARS = 48_000

    fun fromEvent(project: Project, e: AnActionEvent, fileSync: FileSync): ContextItem? {
        val editor = e.getData(CommonDataKeys.EDITOR) ?: FileEditorManager.getInstance(project).selectedTextEditor ?: return null
        val vf = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: FileDocumentManager.getInstance().getFile(editor.document) ?: return null
        return fromEditor(editor, vf, fileSync)
    }

    fun fromEditor(editor: Editor, vf: VirtualFile, fileSync: FileSync): ContextItem {
        val sel = editor.selectionModel
        val doc = editor.document
        return if (sel.hasSelection()) {
            val start = doc.getLineNumber(sel.selectionStart) + 1
            val endOffset = if (sel.selectionEnd > 0 && sel.selectionEnd > sel.selectionStart) sel.selectionEnd - 1 else sel.selectionEnd
            val end = doc.getLineNumber(endOffset) + 1
            ContextItem(
                kind = "selection", path = fileSync.relative(vf), absPath = vf.path,
                startLine = start, endLine = end, text = (sel.selectedText ?: "").take(MAX_SELECTION_CHARS),
            )
        } else {
            ContextItem(kind = "file", path = fileSync.relative(vf), absPath = vf.path)
        }
    }

    fun fromFile(vf: VirtualFile, fileSync: FileSync): ContextItem =
        ContextItem(kind = "file", path = fileSync.relative(vf), absPath = vf.path)

    fun readText(item: ContextItem): String? {
        if (item.text != null) return item.text
        return try {
            val f = java.io.File(item.absPath)
            if (!f.isFile || f.length() > 4L * 1024 * 1024) null else f.readText().take(MAX_FILE_CHARS)
        } catch (_: Exception) {
            null
        }
    }
}
