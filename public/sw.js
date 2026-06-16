self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      title: data.title || "WaBooking",
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.data?.url || "/dashboard",
      },
      vibrate: [200, 100, 200],
    }

    event.waitUntil(self.registration.showNotification(options.title, options))
  } catch {
    // ignore invalid payload
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/dashboard"
  event.waitUntil(clients.openWindow(url))
})
