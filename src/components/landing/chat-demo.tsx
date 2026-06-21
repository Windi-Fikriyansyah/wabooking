"use client"

import React, { useState, useEffect, useRef } from "react"

interface Message {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: string
  isInteractive?: boolean
}

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState(0) // 0: greeting, 1: choose service, 2: choose date, 3: choose time, 4: input name, 5: completed
  const [typing, setTyping] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [nameInput, setNameInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  // Initial Message
  useEffect(() => {
    resetChat()
  }, [])

  const resetChat = () => {
    setMessages([])
    setStep(0)
    setSelectedService("")
    setSelectedDate("")
    setSelectedTime("")
    setNameInput("")
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      setMessages([
        {
          id: "msg-1",
          sender: "bot",
          text: "Halo! 👋 Selamat datang di Barber & Co. Saya adalah asisten virtual WaBooking yang siap membantu Anda menjadwalkan kunjungan secara otomatis.",
          timestamp: formatTime(),
        },
        {
          id: "msg-2",
          sender: "bot",
          text: "Silakan pilih layanan yang Anda inginkan hari ini:",
          timestamp: formatTime(),
          isInteractive: true,
        },
      ])
      setStep(1)
    }, 1000)
  }

  const handleSelectService = (service: string) => {
    if (step !== 1) return

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: service,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setSelectedService(service)
    setStep(2)
    setTyping(true)

    // Simulate bot response
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Pilihan yang bagus! 👍 Anda memilih *${service}*.\n\nSekarang, silakan pilih tanggal kunjungan Anda:`,
          timestamp: formatTime(),
          isInteractive: true,
        },
      ])
    }, 1200)
  }

  const handleSelectDate = (date: string) => {
    if (step !== 2) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: date,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setSelectedDate(date)
    setStep(3)
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Baik, tanggal *${date}*. Silakan pilih jam kedatangan yang tersedia:`,
          timestamp: formatTime(),
          isInteractive: true,
        },
      ])
    }, 1200)
  }

  const handleSelectTime = (time: string) => {
    if (step !== 3) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: time,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setSelectedTime(time)
    setStep(4)
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Jadwal dipilih: *${time}*.\n\nTerakhir, silakan ketik nama lengkap Anda untuk mengonfirmasi booking:`,
          timestamp: formatTime(),
        },
      ])
    }, 1200)
  }

  const handleSendName = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (step !== 4 || !nameInput.trim()) return

    const name = nameInput.trim()
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: name,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setStep(5)
    setTyping(true)

    // Generate random booking code
    const bookingCode = `WB-${Math.floor(1000 + Math.random() * 9000)}`

    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `✅ *BOOKING BERHASIL DIKONFIRMASI!*\n\n📌 *Detail Reservasi:*\n• *Nama:* ${name}\n• *Layanan:* ${selectedService}\n• *Tanggal:* ${selectedDate}\n• *Waktu:* ${selectedTime}\n• *Kode Booking:* ${bookingCode}\n\n💬 *Reminder otomatis* via WhatsApp akan dikirimkan H-1 dan 1 jam sebelum jadwal Anda.\n\nTerima kasih telah menggunakan layanan kami! 🙏`,
          timestamp: formatTime(),
        },
      ])
    }, 1500)
  }

  return (
    <div className="wa-demo-card">
      <div className="wa-demo-header">
        <div className="wa-demo-avatar">
          <span>B&C</span>
          <div className="wa-demo-avatar-online" />
        </div>
        <div className="wa-demo-header-info">
          <p className="wa-demo-name">Barber & Co (Demo Bot)</p>
          <p className="wa-demo-status">Online • Membalas otomatis</p>
        </div>
        <button className="wa-demo-reset-btn" onClick={resetChat} title="Ulangi Simulasi">
          🔄 Reset
        </button>
      </div>

      <div className="wa-demo-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`wa-demo-bubble-wrapper ${
              msg.sender === "bot" ? "wa-demo-incoming" : "wa-demo-outgoing"
            }`}
          >
            <div className="wa-demo-bubble">
              <p className="wa-demo-bubble-text">{msg.text}</p>
              <span className="wa-demo-bubble-time">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="wa-demo-bubble-wrapper wa-demo-incoming">
            <div className="wa-demo-bubble wa-demo-typing">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="wa-demo-footer">
        {/* Interactive choices based on current step */}
        {step === 1 && !typing && (
          <div className="wa-demo-choices">
            <button
              onClick={() => handleSelectService("💇 Potong Rambut")}
              className="wa-demo-choice-btn"
            >
              💇 Potong Rambut
            </button>
            <button
              onClick={() => handleSelectService("🧴 Creambath")}
              className="wa-demo-choice-btn"
            >
              🧴 Creambath
            </button>
            <button
              onClick={() => handleSelectService("🎨 Hair Coloring")}
              className="wa-demo-choice-btn"
            >
              🎨 Hair Coloring
            </button>
          </div>
        )}

        {step === 2 && !typing && (
          <div className="wa-demo-choices">
            <button
              onClick={() => handleSelectDate("Senin, 22 Jun")}
              className="wa-demo-choice-btn"
            >
              Senin, 22 Jun (Besok)
            </button>
            <button
              onClick={() => handleSelectDate("Selasa, 23 Jun")}
              className="wa-demo-choice-btn"
            >
              Selasa, 23 Jun
            </button>
            <button
              onClick={() => handleSelectDate("Rabu, 24 Jun")}
              className="wa-demo-choice-btn"
            >
              Rabu, 24 Jun
            </button>
          </div>
        )}

        {step === 3 && !typing && (
          <div className="wa-demo-choices">
            <button
              onClick={() => handleSelectTime("09.00 WIB")}
              className="wa-demo-choice-btn"
            >
              09.00 WIB
            </button>
            <button
              onClick={() => handleSelectTime("13.00 WIB")}
              className="wa-demo-choice-btn"
            >
              13.00 WIB
            </button>
            <button
              onClick={() => handleSelectTime("16.00 WIB")}
              className="wa-demo-choice-btn"
            >
              16.00 WIB
            </button>
          </div>
        )}

        {step === 4 && !typing && (
          <form onSubmit={handleSendName} className="wa-demo-input-form">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ketik nama Anda di sini..."
              className="wa-demo-input"
              autoFocus
            />
            <button type="submit" className="wa-demo-send-btn">
              Kirim
            </button>
          </form>
        )}

        {step === 5 && !typing && (
          <div className="wa-demo-success-footer">
            <p className="wa-demo-success-text">🎉 Simulasi Selesai!</p>
            <button onClick={resetChat} className="wa-demo-restart-btn">
              Coba Lagi
            </button>
          </div>
        )}

        {typing && (
          <div className="wa-demo-input-placeholder">
            Bot sedang mengetik...
          </div>
        )}

        {step < 4 && !typing && (
          <div className="wa-demo-input-placeholder">
            Pilih opsi di atas untuk membalas...
          </div>
        )}
      </div>
    </div>
  )
}
