export type BotState =
  | "IDLE"
  | "MAIN_MENU"
  | "BOOKING_START"
  | "SELECT_SERVICE"
  | "SELECT_DATE"
  | "SELECT_TIME"
  | "INPUT_NAME"
  | "CONFIRM"
  | "VIEW_BOOKING"

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

export interface FlowMessage {
  flow_id: string
  flow_cta: string
  body: string
  header?: { type: string; text: string }
  footer?: string
  flow_action_payload?: Record<string, unknown>
}

export interface HandlerResult {
  reply: string
  newState: BotState
  context?: BotContext
  interactive?: Record<string, unknown>
  flowMessage?: FlowMessage
}

export function isGlobalCommand(text: string): string | null {
  const lower = text.trim().toLowerCase()
  if (["batal", "cancel", "keluar"].includes(lower)) return "CANCEL"
  if (lower.startsWith("status ")) return "STATUS"
  if (["bantuan", "help"].includes(lower)) return "HELP"
  if (["halo", "hai", "hi", "hello", "p", "tes", "test"].includes(lower)) return "START"
  if (["menu", "balik", "kembali"].includes(lower)) return "MENU"
  if (["booking", "book"].includes(lower)) return "BOOKING"
  return null
}
