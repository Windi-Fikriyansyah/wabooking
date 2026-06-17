export type BotState =
  | "IDLE"
  | "SELECT_SERVICE"
  | "SELECT_DATE"
  | "SELECT_TIME"
  | "INPUT_NAME"
  | "CONFIRM"

export interface BotContext {
  serviceId?: string
  serviceName?: string
  serviceDuration?: number
  date?: string
  dateIndex?: number
  time?: string
  customerName?: string
  customerWa?: string
  [key: string]: unknown
}

export interface HandlerResult {
  reply: string
  newState: BotState
  context?: BotContext
  interactive?: Record<string, unknown>
}

export function isGlobalCommand(text: string): string | null {
  const lower = text.trim().toLowerCase()
  if (["batal", "cancel", "keluar"].includes(lower)) return "CANCEL"
  if (lower.startsWith("status ")) return "STATUS"
  if (["bantuan", "help"].includes(lower)) return "HELP"
  if (["halo", "hai", "hi", "hello", "p", "tes", "test"].includes(lower)) return "START"
  return null
}
