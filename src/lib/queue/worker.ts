import { createReminderWorker } from "./workers/reminder.worker"
import { createNotificationWorker } from "./workers/notification.worker"

let reminderWorker: ReturnType<typeof createReminderWorker> | null = null
let notificationWorker: ReturnType<typeof createNotificationWorker> | null = null

export function startWorkers() {
  reminderWorker = createReminderWorker()
  notificationWorker = createNotificationWorker()

  console.log("[WORKERS] Reminder and Notification workers started")

  return { reminderWorker, notificationWorker }
}

export function stopWorkers() {
  if (reminderWorker) {
    reminderWorker.close()
    reminderWorker = null
  }
  if (notificationWorker) {
    notificationWorker.close()
    notificationWorker = null
  }
  console.log("[WORKERS] All workers stopped")
}
