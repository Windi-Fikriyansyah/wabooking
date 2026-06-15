import type { BookingStatus, ReminderType, ReminderStatus } from "@prisma/client"
export type BotState = "IDLE" | "SELECT_SERVICE" | "SELECT_DATE" | "SELECT_TIME" | "INPUT_NAME" | "CONFIRM"

export interface BusinessData {
  id: string
  name: string
  type: string
  address: string | null
  logoUrl: string | null
  description: string | null
  timezone: string
  waNumber: string | null
  waConnected: boolean
  zernioApiKey: string | null
}

export interface ServiceData {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number | null
  isActive: boolean
  sortOrder: number
}

export interface ScheduleData {
  dayOfWeek: number
  openTime: string
  closeTime: string
  slotIntervalMin: number
  maxConcurrent: number
  isActive: boolean
}

export interface BookingData {
  id: string
  businessId: string
  serviceId: string
  customerName: string
  customerWa: string
  scheduledAt: Date
  durationMinutes: number
  status: BookingStatus
  bookingCode: string
  notes: string | null
}

export interface BotSessionData {
  id: string
  businessId: string
  waNumber: string
  state: BotState
  contextData: Record<string, unknown>
  expiresAt: Date
}

export interface TimeSlot {
  time: string
  available: boolean
}

export type { BookingStatus, ReminderType, ReminderStatus }
