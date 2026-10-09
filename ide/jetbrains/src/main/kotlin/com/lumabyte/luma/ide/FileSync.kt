package com.lumabyte.luma.ide

import com.intellij.diff.DiffContentFactory
import com.intellij.diff.DiffManager
import com.intellij.diff.requests.SimpleDiffRequest
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.ReadAction
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFile
import java.io.File
import java.nio.file.Path
import java.nio.file.Paths

class FileSync(private val project: Project) {
    private val snapshots = object : LinkedHashMap<String, String>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, String>?): Boolean = size > 40
    }

    fun resolve(root: String?, path: String): Path {
        val p = Paths.get(path)
        if (p.isAbsolute) return p.normalize()
        val base = root?.takeIf { it.isNotBlank() } ?: project.basePath ?: System.getProperty("user.dir")
        return Paths.get(base).resolve(p).normalize()
    }

    private fun key(p: Path) = p.toString().lowercase()

    fun snapshot(root: String?, path: String) {
        val abs = resolve(root, path)
        val text = try {
            val vf = LocalFileSystem.getInstance().findFileByNioFile(abs)
            if (vf != null && !vf.isDirectory) {
                ReadAction.compute<String, Throwable> {
                    FileDocumentManager.getInstance().getDocument(vf)?.text ?: String(vf.contentsToByteArray(), vf.charset)
                }
            } else if (abs.toFile().isFile) abs.toFile().readText() else ""
        } catch (_: Throwable) {
            ""
        }
        synchronized(snapshots) { snapshots[key(abs)] = text }
    }

    fun afterWrite(root: String?, path: String, open: Boolean) {
        val abs = resolve(root, path)
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            val vf = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(abs) ?: return@invokeLater
            vf.refresh(false, false)
            if (open && vf.isValid && !vf.isDirectory) {
                FileEditorManager.getInstance(project).openFile(vf, false)
            }
        }
    }

    fun hasSnapshot(root: String?, path: String): Boolean = synchronized(snapshots) { snapshots.containsKey(key(resolve(root, path))) }

    fun showDiff(root: String?, path: String) {
        val abs = resolve(root, path)
        val before = synchronized(snapshots) { snapshots[key(abs)] } ?: ""
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            val vf: VirtualFile? = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(abs)
            val factory = DiffContentFactory.getInstance()
            val left = factory.create(project, before, vf?.fileType)
            val right = if (vf != null) factory.create(project, vf) else factory.create(project, abs.toFile().takeIf { it.isFile }?.readText() ?: "")
            val name = abs.fileName?.toString() ?: path
            DiffManager.getInstance().showDiff(project, SimpleDiffRequest("Luma: $name", left, right, "Before", "After (current file)"))
        }
    }

    fun openFile(root: String?, path: String, line: Int? = null) {
        val abs = resolve(root, path)
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            val vf = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(abs) ?: return@invokeLater
            if (vf.isDirectory) return@invokeLater
            val descriptor = if (line != null && line > 0) OpenFileDescriptor(project, vf, line - 1, 0) else OpenFileDescriptor(project, vf)
            descriptor.navigate(true)
        }
    }

    fun insertAtCaret(text: String) {
        ApplicationManager.getApplication().invokeLater {
            if (project.isDisposed) return@invokeLater
            val editor = FileEditorManager.getInstance(project).selectedTextEditor ?: return@invokeLater
            WriteCommandAction.runWriteCommandAction(project, "Insert From Luma", null, {
                val sel = editor.selectionModel
                if (sel.hasSelection()) {
                    editor.document.replaceString(sel.selectionStart, sel.selectionEnd, text)
                } else {
                    editor.document.insertString(editor.caretModel.offset, text)
                }
            })
        }
    }

    fun relative(file: VirtualFile): String {
        val base = project.basePath ?: return file.path
        val rel = try { Paths.get(base).relativize(Paths.get(file.path)).toString() } catch (_: Exception) { file.path }
        return if (rel.startsWith("..")) file.path else rel.replace(File.separatorChar, '/')
    }
}
