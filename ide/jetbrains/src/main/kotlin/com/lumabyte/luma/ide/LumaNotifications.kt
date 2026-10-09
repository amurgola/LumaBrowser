package com.lumabyte.luma.ide

import com.intellij.notification.Notification
import com.intellij.notification.NotificationAction
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import com.lumabyte.luma.LumaIcons

object LumaNotifications {
    private fun group() = NotificationGroupManager.getInstance().getNotificationGroup("Luma")

    fun info(project: Project?, title: String, content: String): Notification =
        group().createNotification(title, content, NotificationType.INFORMATION).setIcon(LumaIcons.ToolWindow).also { it.notify(project) }

    fun warn(project: Project?, title: String, content: String): Notification =
        group().createNotification(title, content, NotificationType.WARNING).setIcon(LumaIcons.ToolWindow).also { it.notify(project) }

    fun approval(project: Project, tool: String, detail: String, decide: (String) -> Unit): Notification {
        val n = group().createNotification("Luma wants to $tool", detail, NotificationType.INFORMATION).setIcon(LumaIcons.ToolWindow)
        n.setImportant(true)
        n.addAction(NotificationAction.createSimpleExpiring("Allow once") { decide("once") })
        n.addAction(NotificationAction.createSimpleExpiring("Allow for this run") { decide("run") })
        n.addAction(NotificationAction.createSimpleExpiring("Deny") { decide("reject") })
        n.notify(project)
        return n
    }
}
