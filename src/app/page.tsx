import Link from "next/link"
import type { Metadata } from "next"
import ChatDemo from "@/components/landing/chat-demo"
import RoiCalculator from "@/components/landing/roi-calculator"

export const metadata: Metadata = {
  title: "Otomatiskan Booking WhatsApp 24/7 Tanpa Admin Tambahan - WaBooking",
  description:
    "Chatbot WhatsApp yang menerima booking, mengatur jadwal, mengirim reminder, dan mengonfirmasi pelanggan secara otomatis. Mulai gratis sekarang!",
}

/* ─── inline SVG icons ─── */
function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

const BUSINESS_LOGOS = [
  { name: "Gentleman Barbershop" },
  { name: "Glow Salon & Beauty" },
  { name: "Klinik Medika Utama" },
  { name: "Dr. Smile Dental Clinic" },
  { name: "Lotus Spa & Wellness" },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pelanggan Chat WhatsApp",
    desc: "Pelanggan mengirim pesan sapaan seperti biasa ke nomor WhatsApp bisnis Anda.",
    icon: "💬",
  },
  {
    step: "02",
    title: "Bot Menanyakan Detail",
    desc: "Bot otomatis membalas dan memandu proses pemilihan layanan, tanggal, dan jam yang tersedia.",
    icon: "🤖",
  },
  {
    step: "03",
    title: "Booking Terkonfirmasi",
    desc: "Booking langsung tersimpan di kalender Anda dan pelanggan langsung menerima konfirmasi resmi.",
    icon: "✅",
  },
]

const BENEFITS = [
  {
    icon: "⏳",
    title: "Hemat Waktu",
    desc: "Kurangi pekerjaan administrasi manual admin Anda hingga 80% setiap hari.",
  },
  {
    icon: "🔔",
    title: "Kurangi No Show",
    desc: "Pesan reminder otomatis terkirim via WhatsApp H-1 dan 1 jam sebelum janji temu.",
  },
  {
    icon: "⚡",
    title: "Tingkatkan Penjualan",
    desc: "Respon chat pelanggan secepat kilat dalam hitungan detik untuk konversi terbaik.",
  },
  {
    icon: "🌙",
    title: "Buka 24 Jam",
    desc: "Terima dan proses booking pelanggan secara otomatis bahkan saat toko Anda sedang tutup.",
  },
]

const FEATURES_LIST = [
  {
    icon: "📱",
    title: "WhatsApp Booking",
    desc: "Proses reservasi langsung via WhatsApp resmi Meta. Koneksi 100% aman, pesan instan, dan nomor bebas risiko banned.",
  },
  {
    icon: "📅",
    title: "Kalender Otomatis",
    desc: "Sinkronisasi semua jadwal masuk secara real-time untuk mencegah terjadinya jadwal ganda atau bentrok.",
  },
  {
    icon: "⏰",
    title: "Reminder Otomatis",
    desc: "Kirim pesan pengingat jadwal kepada pelanggan agar mereka tidak lupa datang pada waktu yang ditentukan.",
  },
  {
    icon: "📊",
    title: "Dashboard Booking",
    desc: "Pantau, kelola, dan analisis semua data booking secara tersentralisasi dalam satu dashboard modern.",
  },
  {
    icon: "👥",
    title: "Manajemen Kontak",
    desc: "Sinkronkan dan kelola seluruh kontak pelanggan WhatsApp Anda secara otomatis dari dashboard.",
  },
  {
    icon: "🧠",
    title: "Bot Chat Interaktif",
    desc: "Bot WhatsApp berbasis menu dan tombol yang memandu pelanggan memilih layanan dan jam secara interaktif.",
  },
]

const TARGET_INDUSTRIES = [
  { icon: "💈", title: "Barbershop" },
  { icon: "💇‍♀️", title: "Salon" },
  { icon: "🏥", title: "Klinik" },
  { icon: "🩺", title: "Dokter" },
  { icon: "🧘‍♀️", title: "Spa" },
  { icon: "🚗", title: "Rental Mobil" },
  { icon: "📸", title: "Studio Foto" },
  { icon: "👔", title: "Konsultan" },
  { icon: "📚", title: "Kursus" },
  { icon: "🏋️‍♂️", title: "Gym" },
]

const TESTIMONIALS_DATA = [
  {
    name: "Budi Santoso",
    role: "Owner Brotherhood Barbershop",
    text: "Sebelum menggunakan sistem ini kami sering kehilangan booking. Sekarang hampir semua booking masuk otomatis melalui WhatsApp.",
    avatar: "BS",
  },
  {
    name: "Sarah Amelia",
    role: "Founder Glow Beauty Salon",
    text: "Reminder otomatisnya juara! Tingkat pelanggan tidak datang (no-show) berkurang drastis dari 30% menjadi hampir 0%.",
    avatar: "SA",
  },
  {
    name: "Dr. Handoko",
    role: "Klinik Gigi Smile Center",
    text: "Pasien merasa sangat terbantu karena tidak perlu mengunduh aplikasi lain. Setupnya pun sangat cepat dan mudah digunakan.",
    avatar: "DH",
  },
]

const FAQS_DATA = [
  {
    q: "Apakah WaBooking menggunakan API Resmi atau Unofficial?",
    a: "WaBooking 100% menggunakan WhatsApp Business Cloud API Resmi dari Meta (Official API). Kami tidak menggunakan sistem unofficial (seperti QR scan web scraper) yang rawan diblokir oleh pihak WhatsApp. Dengan API resmi Meta, nomor bisnis Anda terjamin aman 100%, pengiriman pesan reminder berkecepatan tinggi, dan HP Anda tidak harus menyala/online terus-menerus.",
  },
  {
    q: "Apakah harus punya WhatsApp Business?",
    a: "Tidak wajib. Anda bisa menggunakan nomor WhatsApp pribadi biasa maupun nomor WhatsApp Business untuk dihubungkan ke sistem WaBooking.",
  },
  {
    q: "Apakah bisa multi admin?",
    a: "Saat ini WaBooking mendukung satu admin per akun bisnis. Fitur multi admin dan staf akan segera hadir di pengembangan selanjutnya.",
  },
  {
    q: "Apakah bisa custom flow?",
    a: "Tentu saja. Anda dapat mengatur alur chatbot Anda sendiri mulai dari menyapa pelanggan, daftar pilihan layanan, jam operasional, hingga pesan konfirmasi penutup.",
  },
  {
    q: "Apakah ada biaya per pesan?",
    a: "Tidak ada biaya per pesan. Kami menggunakan sistem biaya berlangganan bulanan flat rate tanpa biaya tersembunyi berapapun pesan yang terkirim.",
  },
  {
    q: "Berapa lama setup?",
    a: "Setup sangat cepat! Anda bisa online dan mulai menerima booking otomatis dalam waktu kurang dari 5 menit saja.",
  },
]

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* ─── NAV ─── */}
      <nav className="landing-nav" id="nav-top">
        <div className="landing-container landing-nav-inner">
          <Link href="/" className="landing-logo" id="logo-link">
            <div className="landing-logo-icon">
              <WhatsAppIcon className="h-5 w-5 text-white" />
            </div>
            <span className="landing-logo-text">WaBooking</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#masalah" className="landing-nav-link">Solusi</a>
            <a href="#cara-kerja" className="landing-nav-link">Cara Kerja</a>
            <a href="#demo-chat" className="landing-nav-link">Demo Live</a>
            <a href="#fitur" className="landing-nav-link">Fitur</a>
            <a href="#pricing" className="landing-nav-link">Harga</a>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="landing-btn-ghost" id="btn-login-nav">
              Masuk
            </Link>
            <Link href="/register" className="landing-btn-primary" id="btn-register-nav">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── 1. HERO SECTION (Above The Fold) ─── */}
      <section className="landing-hero" id="hero">
        <div className="landing-hero-blob landing-hero-blob--1" />
        <div className="landing-hero-blob landing-hero-blob--2" />
        <div className="landing-hero-blob landing-hero-blob--3" />

        <div className="landing-container landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-hero-badge" id="hero-badge">
              <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
              <span>100% WhatsApp Business API Resmi Meta</span>
            </div>
            <h1 className="landing-hero-title" id="hero-title">
              Otomatiskan Booking
              <br />
              <span className="landing-hero-title-highlight">WhatsApp 24/7</span>
              <br />
              Tanpa Admin Tambahan
            </h1>
            <p className="landing-hero-desc" id="hero-desc">
              Chatbot WhatsApp yang menerima booking, mengatur jadwal, mengirim reminder, dan mengonfirmasi pelanggan secara otomatis.
            </p>
            <div className="landing-hero-actions">
              <Link href="/register" className="landing-btn-primary landing-btn-lg" id="btn-hero-register">
                Coba Gratis
              </Link>
              <a href="#demo-chat" className="landing-btn-outline landing-btn-lg" id="btn-hero-demo-live">
                Demo Live
              </a>
              <a href="#pricing" className="landing-btn-ghost landing-btn-lg" id="btn-hero-booking-demo">
                Booking Demo
              </a>
            </div>
            <div className="landing-hero-trust">
              <div className="landing-hero-avatars">
                {["BS", "SA", "DH", "AP"].map((initials, i) => (
                  <div key={i} className="landing-hero-avatar" style={{ zIndex: 10 - i }}>
                    {initials}
                  </div>
                ))}
              </div>
              <p className="landing-hero-trust-text">
                Dipercaya oleh <strong>500+ bisnis</strong> di Indonesia
              </p>
            </div>
          </div>

          {/* Visual: Chatbot Mockup Visual */}
          <div className="landing-hero-mockup" id="hero-mockup">
            <div className="landing-phone">
              <div className="landing-phone-notch" />
              <div className="landing-phone-screen">
                <div className="landing-wa-header">
                  <div className="landing-wa-header-avatar">WB</div>
                  <div>
                    <p className="landing-wa-header-name">WaBooking Bot</p>
                    <p className="landing-wa-header-status">Online • Membalas 24/7</p>
                  </div>
                </div>
                <div className="landing-wa-chat">
                  <div className="landing-wa-bubble landing-wa-bubble--incoming">
                    Halo! 👋 Mau booking layanan apa hari ini?
                    <br /><br />
                    1️⃣ Potong Rambut<br />
                    2️⃣ Creambath<br />
                    3️⃣ Hair Coloring
                  </div>
                  <div className="landing-wa-bubble landing-wa-bubble--outgoing">
                    1️⃣ Potong Rambut
                  </div>
                  <div className="landing-wa-bubble landing-wa-bubble--incoming">
                    Silakan pilih jam kedatangan:<br />
                    📅 Senin, 22 Juni<br /><br />
                    ⏰ 10:00 | 13:00 | 16:00
                  </div>
                  <div className="landing-wa-bubble landing-wa-bubble--outgoing">
                    10:00
                  </div>
                  <div className="landing-wa-bubble landing-wa-bubble--incoming">
                    ✅ <strong>Booking Terkonfirmasi!</strong>
                    <br /><br />
                    Layanan: Potong Rambut<br />
                    Jadwal: Senin, 22 Jun pukul 10:00<br />
                    Kode: BK-9921
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. SOCIAL PROOF ─── */}
      <section className="landing-types" id="social-proof" style={{ background: "#ffffff", padding: "64px 0" }}>
        <div className="landing-container">
          <p className="landing-types-label" style={{ marginBottom: "16px" }}>Dipercaya oleh 500+ Bisnis Aktif</p>
          <div className="logos-cloud">
            {BUSINESS_LOGOS.map((logo) => (
              <div key={logo.name} className="logo-item">
                <div className="logo-dot" />
                <span>{logo.name}</span>
              </div>
            ))}
          </div>
          <div className="landing-stats" style={{ background: "transparent", padding: "60px 0 0 0" }}>
            <div className="landing-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="landing-stat-item" style={{ borderRight: "1px solid var(--landing-border)" }}>
                <div className="landing-stat-value" style={{ color: "var(--wa-green-900)", fontSize: "48px" }}>10.000+</div>
                <div className="landing-stat-label" style={{ color: "var(--landing-text-muted)", fontSize: "16px", fontWeight: 600 }}>Booking Diproses</div>
              </div>
              <div className="landing-stat-item" style={{ borderRight: "1px solid var(--landing-border)" }}>
                <div className="landing-stat-value" style={{ color: "var(--wa-green-900)", fontSize: "48px" }}>500+</div>
                <div className="landing-stat-label" style={{ color: "var(--landing-text-muted)", fontSize: "16px", fontWeight: 600 }}>Bisnis Aktif</div>
              </div>
              <div className="landing-stat-item">
                <div className="landing-stat-value" style={{ color: "var(--wa-green-900)", fontSize: "48px" }}>98%</div>
                <div className="landing-stat-label" style={{ color: "var(--landing-text-muted)", fontSize: "16px", fontWeight: 600 }}>Tingkat Respons</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. PROBLEM SECTION ─── */}
      <section className="landing-features" id="masalah" style={{ background: "#fafbfc" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Masalah & Solusi</span>
            <h2 className="landing-section-title">Mengapa Cara Lama Harus Ditinggalkan?</h2>
            <p className="landing-section-desc">
              Bandingkan keribetan operasional manual dengan otomatisasi penuh WhatsApp Booking.
            </p>
          </div>
          <div className="problem-grid">
            {/* Sebelum (Merah) */}
            <div className="problem-card problem-card--sebelum">
              <h3 className="problem-card-title">
                <span className="problem-item-icon">❌</span> Sebelum Menggunakan WaBooking
              </h3>
              <ul className="problem-list">
                <li className="problem-item">
                  <span className="problem-item-icon">❌</span>
                  <div className="problem-item-text">
                    <strong>Chat Masuk Tengah Malam</strong>
                    <span>Pelanggan chat di luar jam operasional. Respon lambat membuat pelanggan lari ke kompetitor.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">❌</span>
                  <div className="problem-item-text">
                    <strong>Jadwal Sering Bentrok</strong>
                    <span>Pencatatan manual di kertas sering keliru, membuat dua pelanggan datang di jam yang sama.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">❌</span>
                  <div className="problem-item-text">
                    <strong>Admin Lupa Follow-up</strong>
                    <span>Admin sibuk melayani pembeli langsung dan lupa mengingatkan pelanggan yang memiliki janji temu.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">❌</span>
                  <div className="problem-item-text">
                    <strong>Pelanggan Tidak Jadi Datang</strong>
                    <span>Tingkat no-show tinggi karena tidak adanya reminder, menyebabkan kerugian pendapatan harian.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Sesudah (Hijau) */}
            <div className="problem-card problem-card--sesudah">
              <h3 className="problem-card-title">
                <span className="problem-item-icon">✅</span> Sesudah Menggunakan WaBooking
              </h3>
              <ul className="problem-list">
                <li className="problem-item">
                  <span className="problem-item-icon">✅</span>
                  <div className="problem-item-text">
                    <strong>Booking Otomatis 24/7</strong>
                    <span>Bot WhatsApp langsung merespons dan melayani booking kapan saja, bahkan saat Anda tertidur pulang.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">✅</span>
                  <div className="problem-item-text">
                    <strong>Jadwal Real-Time</strong>
                    <span>Sistem memeriksa ketersediaan slot secara otomatis dan instan. Tidak ada lagi risiko bentrok jadwal.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">✅</span>
                  <div className="problem-item-text">
                    <strong>Reminder Otomatis</strong>
                    <span>Notifikasi pengingat dikirim otomatis ke WhatsApp pelanggan, meminimalisir kelupaan janji.</span>
                  </div>
                </li>
                <li className="problem-item">
                  <span className="problem-item-icon">✅</span>
                  <div className="problem-item-text">
                    <strong>Konfirmasi Instan</strong>
                    <span>Begitu pelanggan memilih jam, tiket booking dan detail reservasi langsung dikirim secara realtime.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS (3 Langkah) ─── */}
      <section className="landing-steps" id="cara-kerja">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Cara Kerja</span>
            <h2 className="landing-section-title">Proses Mudah dalam 3 Langkah</h2>
            <p className="landing-section-desc">
              Sistem booking kami dirancang sesederhana mungkin untuk kenyamanan pelanggan Anda.
            </p>
          </div>
          <div className="landing-steps-grid">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="landing-step-card" id={`step-${s.step}`}>
                <div className="landing-step-num">{s.step}</div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. DEMO CHAT INTERAKTIF ─── */}
      <section className="landing-features" id="demo-chat" style={{ background: "#ffffff" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Coba Live</span>
            <h2 className="landing-section-title">Demo Chat Interaktif</h2>
            <p className="landing-section-desc">
              Silakan coba klik tombol interaktif di dalam layar WhatsApp di bawah ini untuk melihat cara kerja bot booking kami.
            </p>
          </div>
          <ChatDemo />
        </div>
      </section>

      {/* ─── 6. BENEFIT SECTION ─── */}
      <section className="landing-features" id="benefits" style={{ background: "#fafbfc" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Keuntungan</span>
            <h2 className="landing-section-title">Fokus pada Hasil yang Nyata</h2>
            <p className="landing-section-desc">
              Bagaimana WaBooking membantu meningkatkan efisiensi dan pendapatan bisnis Anda secara langsung.
            </p>
          </div>
          <div className="landing-features-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {BENEFITS.map((b) => (
              <div key={b.title} className="landing-feature-card" style={{ padding: "40px" }}>
                <div className="landing-feature-icon" style={{ fontSize: "32px", width: "60px", height: "60px" }}>{b.icon}</div>
                <h3 className="landing-feature-title" style={{ fontSize: "20px" }}>{b.title}</h3>
                <p className="landing-feature-desc" style={{ fontSize: "15px", lineHeight: "1.6" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FITUR UTAMA ─── */}
      <section className="landing-features" id="fitur">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Fitur Utama</span>
            <h2 className="landing-section-title">Semua Fitur untuk Kelola Booking</h2>
            <p className="landing-section-desc">
              Dilengkapi dengan dashboard administrasi yang mumpuni untuk mendukung jalannya bisnis harian Anda.
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES_LIST.map((f) => (
              <div key={f.title} className="landing-feature-card" id={`feature-${f.title.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. TARGET INDUSTRI ─── */}
      <section className="landing-types" id="target-industri" style={{ background: "#ffffff" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Target Industri</span>
            <h2 className="landing-section-title">Cocok untuk Apapun Bisnis Jasa Anda</h2>
            <p className="landing-section-desc">
              Sistem booking kami fleksibel dan dapat dikonfigurasi untuk menyesuaikan karakteristik berbagai bidang industri.
            </p>
          </div>
          <div className="industries-grid">
            {TARGET_INDUSTRIES.map((ind) => (
              <div key={ind.title} className="industry-card">
                <span className="industry-icon">{ind.icon}</span>
                <h4 className="industry-title">{ind.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. ROI CALCULATOR ─── */}
      <section className="landing-features" id="roi-section" style={{ background: "#fafbfc" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Kalkulator Hemat</span>
            <h2 className="landing-section-title">Hitung Waktu & Biaya yang Dihemat</h2>
            <p className="landing-section-desc">
              Gunakan kalkulator di bawah ini untuk melihat potensi efisiensi bulanan bisnis Anda setelah beralih ke sistem otomatis.
            </p>
          </div>
          <RoiCalculator />
        </div>
      </section>

      {/* ─── 10. TESTIMONI ─── */}
      <section className="landing-testimonials" id="testimoni" style={{ background: "#ffffff" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Testimoni</span>
            <h2 className="landing-section-title">Apa Kata Rekan Pemilik Bisnis?</h2>
          </div>
          <div className="landing-testimonials-grid">
            {TESTIMONIALS_DATA.map((t) => (
              <div key={t.name} className="landing-testimonial-card" id={`testimonial-${t.name.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="landing-testimonial-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="landing-testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="landing-testimonial-author">
                  <div className="landing-testimonial-avatar">{t.avatar}</div>
                  <div>
                    <p className="landing-testimonial-name">{t.name}</p>
                    <p className="landing-testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 11. PRICING ─── */}
      <section className="landing-features" id="pricing" style={{ background: "#fafbfc" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Harga Layanan</span>
            <h2 className="landing-section-title">Pilih Paket yang Sesuai untuk Bisnis Anda</h2>
            <p className="landing-section-desc">
              Rencana harga yang transparan tanpa ada biaya setup awal maupun biaya tersembunyi.
            </p>
          </div>
          <div className="pricing-grid">
            {/* Starter */}
            <div className="pricing-card">
              <h3 className="pricing-name">Starter</h3>
              <div className="pricing-price">
                Rp99.000<span className="pricing-period">/bulan</span>
              </div>
              <p className="pricing-desc">Cocok untuk bisnis perorangan atau yang baru memulai digitalisasi booking.</p>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> 1 Nomor WA (API Resmi Meta)
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Bot Booking WhatsApp Otomatis
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Manajemen Layanan & Jadwal
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Dashboard & Manajemen Booking
                </li>
              </ul>
              <Link href="/register" className="landing-btn-outline pricing-btn" style={{ marginTop: "auto", textAlign: "center", display: "block" }}>
                Pilih Starter
              </Link>
            </div>

            {/* Business */}
            <div className="pricing-card pricing-card--popular">
              <h3 className="pricing-name">Business</h3>
              <div className="pricing-price" style={{ color: "var(--wa-green-900)" }}>
                Rp299.000<span className="pricing-period">/bulan</span>
              </div>
              <p className="pricing-desc">Terbaik untuk bisnis yang berkembang pesat dan butuh bot booking tanpa batas.</p>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> 1 Nomor WA (API Resmi Meta)
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Bot Booking WhatsApp Otomatis
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Reminder Otomatis WhatsApp
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Manajemen Layanan & Jadwal
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Dashboard, Kontak & Pelanggan
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Kustomisasi Pesan Bot
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Prioritas Dukungan WhatsApp
                </li>
              </ul>
              <Link href="/register" className="landing-btn-primary pricing-btn" style={{ marginTop: "auto", textAlign: "center", display: "block" }}>
                Mulai Uji Coba Gratis
              </Link>
            </div>

            {/* Enterprise */}
            <div className="pricing-card">
              <h3 className="pricing-name">Enterprise</h3>
              <div className="pricing-price" style={{ fontSize: "30px" }}>
                Hubungi Kami
              </div>
              <p className="pricing-desc">Dirancang khusus untuk waralaba, bisnis cabang banyak, dan kustom alur kompleks.</p>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Custom Alur & Integrasi API
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Unlimited Admin & Cabang Staf
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Dedicated Integration WA Cloud
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> Account Manager Khusus
                </li>
                <li className="pricing-feature-item">
                  <span className="pricing-feature-icon">✓</span> SLA Garansi Uptime 99.9%
                </li>
              </ul>
              <a href="https://wa.me/6281234567890?text=Halo%20WaBooking,%20saya%20tertarik%20dengan%20paket%20Enterprise" className="landing-btn-outline pricing-btn" style={{ marginTop: "auto", textAlign: "center", display: "block" }}>
                Hubungi Penjualan
              </a>
            </div>
          </div>

          <div className="pricing-highlights">
            <div className="pricing-highlight-item">
              <span style={{ color: "var(--wa-green-600)" }}>✅</span> Gratis setup
            </div>
            <div className="pricing-highlight-item">
              <span style={{ color: "var(--wa-green-600)" }}>✅</span> Gratis update
            </div>
            <div className="pricing-highlight-item">
              <span style={{ color: "var(--wa-green-600)" }}>✅</span> Tanpa kontrak
            </div>
          </div>
        </div>
      </section>

      {/* ─── 12. FAQ ─── */}
      <section className="landing-faq" id="faq">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">FAQ</span>
            <h2 className="landing-section-title">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="landing-faq-list">
            {FAQS_DATA.map((f, i) => (
              <details key={i} className="landing-faq-item" id={`faq-${i}`}>
                <summary className="landing-faq-question">{f.q}</summary>
                <p className="landing-faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. FINAL CTA ─── */}
      <section className="landing-cta" id="cta">
        <div className="landing-container landing-cta-inner">
          <div className="landing-cta-blob landing-cta-blob--1" />
          <div className="landing-cta-blob landing-cta-blob--2" />
          <h2 className="landing-cta-title">
            Siap Mengotomatisasi Booking WhatsApp Anda?
          </h2>
          <p className="landing-cta-desc">
            Aktif dalam 5 menit tanpa perlu coding. Tingkatkan pemesanan dan hemat waktu admin mulai hari ini.
          </p>
          <div className="landing-cta-actions" style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/register" className="landing-btn-white landing-btn-lg" id="btn-cta-trial">
              ✅ Coba Gratis 14 Hari
            </Link>
            <a href="#demo-chat" className="landing-btn-outline landing-btn-lg" id="btn-cta-demo" style={{ background: "transparent", color: "#ffffff", borderColor: "#ffffff" }}>
              ✅ Booking Demo Sekarang
            </a>
          </div>
          <p className="landing-cta-note">Tanpa kartu kredit • Batalkan kapan saja</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer" id="footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <Link href="/" className="landing-logo">
              <div className="landing-logo-icon">
                <WhatsAppIcon className="h-5 w-5 text-white" />
              </div>
              <span className="landing-logo-text">WaBooking</span>
            </Link>
            <p className="landing-footer-desc">
              Platform booking berbasis WhatsApp otomatis untuk bisnis jasa di Indonesia.
            </p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h4 className="landing-footer-heading">Produk</h4>
              <a href="#masalah" className="landing-footer-link">Solusi</a>
              <a href="#cara-kerja" className="landing-footer-link">Cara Kerja</a>
              <a href="#demo-chat" className="landing-footer-link">Demo Live</a>
              <a href="#fitur" className="landing-footer-link">Fitur Utama</a>
            </div>
            <div>
              <h4 className="landing-footer-heading">Dukungan</h4>
              <a href="#faq" className="landing-footer-link">FAQ</a>
              <Link href="/login" className="landing-footer-link">Masuk</Link>
              <Link href="/register" className="landing-footer-link">Daftar</Link>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <div className="landing-container">
            <p className="landing-footer-copy">
              &copy; {new Date().getFullYear()} WaBooking. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
