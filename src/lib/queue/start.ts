import { startWorkers } from "./worker"

console.log("Starting WaBooking queue workers...")
startWorkers()

process.on("SIGINT", () => {
  console.log("Shutting down workers...")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("Shutting down workers...")
  process.exit(0)
})
