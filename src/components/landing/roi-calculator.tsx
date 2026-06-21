"use client"

import React, { useState } from "react"

export default function RoiCalculator() {
  const [bookings, setBookings] = useState(20)
  const [timePerBooking, setTimePerBooking] = useState(5)

  // Calculations
  const timeSavedDayMin = bookings * timePerBooking
  const timeSavedMonthHour = Math.round((timeSavedDayMin * 30) / 60)

  // Format daily savings
  const formatDailySavings = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} Menit`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`
  }

  // Cost savings estimate: let's assume an admin hourly wage of Rp 25.000
  const estimatedCostSavings = timeSavedMonthHour * 25000

  return (
    <div className="roi-calculator">
      <div className="roi-grid">
        {/* Sliders Input */}
        <div className="roi-inputs-card">
          <h3 className="roi-card-title">Atur Parameter Bisnis Anda</h3>
          
          <div className="roi-slider-group">
            <div className="roi-slider-header">
              <label htmlFor="bookings-slider" className="roi-label">Jumlah Booking per Hari</label>
              <span className="roi-value-badge">{bookings} Booking</span>
            </div>
            <input
              id="bookings-slider"
              type="range"
              min="1"
              max="100"
              value={bookings}
              onChange={(e) => setBookings(parseInt(e.target.value))}
              className="roi-range-input"
            />
            <div className="roi-range-labels">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div className="roi-slider-group">
            <div className="roi-slider-header">
              <label htmlFor="time-slider" className="roi-label">Waktu Admin per Booking (Menit)</label>
              <span className="roi-value-badge">{timePerBooking} Menit</span>
            </div>
            <input
              id="time-slider"
              type="range"
              min="1"
              max="30"
              value={timePerBooking}
              onChange={(e) => setTimePerBooking(parseInt(e.target.value))}
              className="roi-range-input"
            />
            <div className="roi-range-labels">
              <span>1m</span>
              <span>15m</span>
              <span>30m</span>
            </div>
          </div>

          <div className="roi-calc-note">
            <p>💡 <em>Rata-rata bisnis menghemat 80% waktu administrasi setelah menggunakan WhatsApp Booking otomatis.</em></p>
          </div>
        </div>

        {/* Results Output */}
        <div className="roi-results-card">
          <h3 className="roi-results-title">Estimasi Efisiensi Anda</h3>
          
          <div className="roi-stat-box">
            <span className="roi-stat-label">Waktu Dihemat / Hari</span>
            <span className="roi-stat-num text-emerald-600">
              {formatDailySavings(timeSavedDayMin)}
            </span>
            <p className="roi-stat-desc">Waktu yang bisa Anda alokasikan untuk melayani pelanggan langsung.</p>
          </div>

          <div className="roi-stat-box">
            <span className="roi-stat-label">Waktu Dihemat / Bulan</span>
            <span className="roi-stat-num text-emerald-600">
              {timeSavedMonthHour} Jam
            </span>
            <p className="roi-stat-desc">Setara dengan bekerja produktif selama hampir 2 minggu penuh!</p>
          </div>

          <div className="roi-divider" />

          <div className="roi-saving-highlight">
            <div className="roi-saving-header">
              <span className="roi-saving-title">Potensi Hemat Biaya Operasional</span>
              <span className="roi-saving-badge">Rekomendasi</span>
            </div>
            <span className="roi-saving-amount">
              Rp {estimatedCostSavings.toLocaleString("id-ID")},- <span className="roi-saving-period">/ bulan</span>
            </span>
            <p className="roi-saving-note">
              *Dihitung berdasarkan rata-rata biaya tenaga kerja Rp 25.000/jam untuk pekerjaan administrasi manual.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
