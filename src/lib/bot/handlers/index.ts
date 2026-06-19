import { prisma } from "@/lib/db";
import {
  getAvailableSlots,
  getNext7Days,
  formatDate,
  isSlotAvailable,
} from "@/lib/bot/availability";
import { notificationQueue } from "@/lib/queue";
import type {
  BotState,
  BotContext,
  HandlerResult,
} from "@/lib/bot/state-machine";

interface HandlerParams {
  businessId: string;
  waNumber: string;
  message: string;
  state: BotState;
  context: BotContext;
}

export async function handleIdle({
  businessId,
  waNumber,
}: HandlerParams): Promise<HandlerResult> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  let customerName = "";
  if (waNumber) {
    const customer = await prisma.customer.findUnique({
      where: { businessId_waNumber: { businessId, waNumber } },
    });
    if (customer) {
      customerName = customer.name;
    } else {
      const contact = await prisma.contact.findUnique({
        where: { businessId_waNumber: { businessId, waNumber } },
        select: { displayName: true },
      });
      customerName = contact?.displayName || "";
    }
  }

  let welcome =
    business?.welcomeMessage || "Halo! Selamat datang di layanan booking kami.";
  welcome = welcome
    .replace(/{nama_pelanggan}/g, customerName)
    .replace(/{nama_bisnis}/g, business?.name || "");

  const reply = `${welcome}\n\n` + `Silakan pilih menu di bawah ini:`;

  const interactive = {
    type: "list",
    body: { text: welcome },
    action: {
      button: "Lihat Menu",
      sections: [
        {
          title: "Menu",
          rows: [
            {
              id: "1",
              title: "Booking Layanan",
              description: "Booking layanan sekarang",
            },
            {
              id: "2",
              title: "Cek Jadwal",
              description: "Cek status booking kamu",
            },
            {
              id: "3",
              title: "Informasi Harga",
              description: "Lihat daftar harga layanan",
            },
          ],
        },
      ],
    },
  };

  return { reply, newState: "MAIN_MENU", interactive };
}

export async function handleMainMenu({
  businessId,
  waNumber,
  message,
}: HandlerParams): Promise<HandlerResult> {
  const lower = message.trim();

  if (lower === "1" || lower.toLowerCase() === "booking layanan") {
    return await handleBookingStart({
      businessId,
      waNumber,
      message,
      state: "MAIN_MENU",
      context: {},
    });
  }

  if (lower === "2" || lower.toLowerCase() === "cek jadwal") {
    return {
      reply:
        "Masukkan kode booking kamu untuk cek status:\n\nKetik kode booking atau ketik *menu* untuk kembali.",
      newState: "VIEW_BOOKING",
    };
  }

  if (lower === "3" || lower.toLowerCase() === "informasi harga") {
    const services = await prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    let info = "*Informasi Harga*\n\n";
    if (services.length > 0) {
      for (const s of services) {
        const price = s.price
          ? `Rp${Number(s.price).toLocaleString("id-ID")}`
          : "Hubungi admin";
        info += `${s.name} — ${s.durationMinutes} menit (${price})\n`;
      }
    } else {
      info += "Belum ada layanan tersedia.\n";
    }
    info += "\n\nSilakan pilih menu di bawah ini:";
    return {
      reply: info,
      newState: "MAIN_MENU",
      interactive: {
        type: "list",
        body: { text: info },
        action: {
          button: "Lihat Menu",
          sections: [
            {
              title: "Menu",
              rows: [
                {
                  id: "1",
                  title: "Booking Layanan",
                  description: "Booking layanan sekarang",
                },
                {
                  id: "2",
                  title: "Cek Jadwal",
                  description: "Cek status booking kamu",
                },
                {
                  id: "3",
                  title: "Informasi Harga",
                  description: "Lihat daftar harga layanan",
                },
              ],
            },
          ],
        },
      },
    };
  }

  return {
    reply:
      "Pilihan tidak valid. Silakan pilih 1-3 atau ketik *menu*.\n\n1. Booking Layanan\n2. Cek Jadwal\n3. Informasi Harga",
    newState: "MAIN_MENU",
  };
}

export async function handleBookingStart({
  businessId,
}: HandlerParams): Promise<HandlerResult> {
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (services.length === 0) {
    return {
      reply: "Maaf, belum ada layanan tersedia. Ketik *menu* untuk kembali.",
      newState: "MAIN_MENU",
    };
  }

  const serviceList = services
    .map(
      (s, i) =>
        `${i + 1}. ${s.name} — ${s.durationMinutes} menit${s.price ? ` (Rp${s.price})` : ""}`,
    )
    .join("\n");

  const interactive = {
    type: "list",
    header: { type: "text", text: "Pilih Layanan" },
    body: {
      text: `Untuk melanjutkan proses booking, silakan pilih layanan yang Anda butuhkan:`,
    },
    action: {
      button: "Pilih Layanan",
      sections: [
        {
          title: "Layanan Tersedia",
          rows: services.map((s, i) => ({
            id: String(i + 1),
            title: s.name,
            description: `${s.durationMinutes} menit${s.price ? ` - Rp${Number(s.price).toLocaleString("id-ID")}` : ""}`,
          })),
        },
      ],
    },
  };

  return {
    reply: `Untuk melanjutkan proses booking, silakan pilih layanan yang Anda butuhkan:\n\n${serviceList}`,
    newState: "SELECT_SERVICE",
    interactive,
  };
}

export async function handleViewBooking({
  businessId,
  message,
}: HandlerParams): Promise<HandlerResult> {
  const code = message.trim().toUpperCase();

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: { service: true },
  });

  if (!booking || booking.businessId !== businessId) {
    return {
      reply:
        "Kode booking tidak ditemukan. Periksa kembali kode atau ketik *menu*.\n\nMasukkan kode booking:",
      newState: "VIEW_BOOKING",
    };
  }

  const dateStr = booking.scheduledAt.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = booking.scheduledAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusMap: Record<string, string> = {
    PENDING: "Menunggu Konfirmasi",
    CONFIRMED: "Dikonfirmasi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };

  return {
    reply:
      `*Detail Booking*\n\n` +
      `Kode: ${booking.bookingCode}\n` +
      `Layanan: ${booking.service?.name || "-"}\n` +
      `Tanggal: ${dateStr}\n` +
      `Jam: ${timeStr}\n` +
      `Status: ${statusMap[booking.status] || booking.status}\n\n` +
      `Ketik *menu* untuk kembali.`,
    newState: "MAIN_MENU",
  };
}

// ── Existing booking flow handlers ────────────────────────────

export async function handleSelectService({
  businessId,
  waNumber,
  message,
  context,
}: HandlerParams): Promise<HandlerResult> {
  const lower = message.trim().toLowerCase();
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({
      businessId,
      waNumber,
      message,
      state: "IDLE",
      context: {},
    });
  }

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const idx = parseInt(message.trim()) - 1;
  if (isNaN(idx) || idx < 0 || idx >= services.length) {
    return {
      reply:
        "Pilihan tidak valid. Silakan ketik nomor layanan yang tersedia atau ketik *menu*.",
      newState: "SELECT_SERVICE",
      context,
    };
  }

  const selected = services[idx];
  const days = getNext7Days();
  const dayList = days.map((d, i) => `${i + 1}. ${formatDate(d)}`).join("\n");

  const interactive = {
    type: "list",
    header: { type: "text", text: selected.name },
    body: {
      text: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang Anda inginkan untuk layanan yang telah dipilih.`,
    },
    action: {
      button: "Pilih Tanggal",
      sections: [
        {
          title: "7 Hari Kedepan",
          rows: days.map((d, i) => ({
            id: String(i + 1),
            title: formatDate(d),
          })),
        },
        {
          title: "Navigasi",
          rows: [
            {
              id: "ubah_layanan",
              title: "Ubah Layanan",
              description: "Ganti layanan yang dipilih",
            },
          ],
        },
      ],
    },
  };

  return {
    reply: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang Anda inginkan untuk layanan yang telah dipilih.\n\n${dayList}\n\nKlik tombol *Pilih Tanggal* untuk melihat kalender dan melanjutkan proses booking.`,
    newState: "SELECT_DATE",
    context: {
      serviceId: selected.id,
      serviceName: selected.name,
      serviceDuration: selected.durationMinutes,
    },
    interactive,
  };
}

export async function handleSelectDate({
  businessId,
  waNumber,
  message,
  context,
}: HandlerParams) {
  const lower = message.trim().toLowerCase();
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({
      businessId,
      waNumber,
      message,
      state: "IDLE",
      context: {},
    });
  }

  if (
    lower === "ubah_layanan" ||
    lower === "ubah layanan" ||
    lower === "ganti layanan"
  ) {
    return await handleBookingStart({
      businessId,
      waNumber: waNumber || "",
      message: "booking",
      state: "IDLE",
      context: {},
    });
  }

  const idx = parseInt(message.trim()) - 1;
  const days = getNext7Days();

  if (isNaN(idx) || idx < 0 || idx >= days.length) {
    return {
      reply:
        "Pilihan tidak valid. Silakan ketik nomor tanggal yang tersedia atau ketik *menu*.",
      newState: "SELECT_DATE" as BotState,
      context,
    };
  }

  const selectedDate = days[idx];
  const slots = await getAvailableSlots(
    businessId,
    selectedDate,
    context.serviceDuration || 60,
  );

  if (slots.length === 0) {
    return {
      reply:
        "Maaf, tidak ada slot tersedia untuk tanggal tersebut. Silakan pilih tanggal lain atau ketik *menu*.",
      newState: "SELECT_DATE" as BotState,
      context,
    };
  }

  const slotList = slots.map((s, i) => `${i + 1}. ${s.time}`).join("\n");

  const interactive = {
    type: "list",
    header: { type: "text", text: formatDate(selectedDate) },
    body: {
      text: `⏰ *Pilih Jam Booking*\n\nSilakan pilih jam yang tersedia untuk tanggal yang telah Anda pilih.\n\nJam yang ditampilkan merupakan slot yang masih tersedia.`,
    },
    action: {
      button: "Pilih Jam",
      sections: [
        {
          title: "Jam Tersedia",
          rows: slots.map((s, i) => ({
            id: String(i + 1),
            title: s.time,
          })),
        },
        {
          title: "Navigasi",
          rows: [
            {
              id: "ubah_tanggal",
              title: "Ubah Tanggal",
              description: "Ganti tanggal booking",
            },
          ],
        },
      ],
    },
  };

  return {
    reply: `⏰ *Pilih Jam Booking*\n\nSilakan pilih jam yang tersedia untuk tanggal yang telah Anda pilih.\n\nJam yang ditampilkan merupakan slot yang masih tersedia.\n\n${slotList}\n\nKlik tombol *Pilih Jam* untuk melanjutkan.`,
    newState: "SELECT_TIME" as BotState,
    context: {
      ...context,
      date: selectedDate.toISOString(),
      dateIndex: idx,
    },
    interactive,
  };
}

export async function handleSelectTime({
  businessId,
  waNumber,
  message,
  context,
}: HandlerParams) {
  const lower = message.trim().toLowerCase();
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({
      businessId,
      waNumber,
      message,
      state: "IDLE",
      context: {},
    });
  }

  if (
    ["ganti tanggal", "ubah tanggal", "ganti tgl", "ubah_tanggal"].includes(
      lower,
    )
  ) {
    const days = getNext7Days();
    const dayList = days.map((d, i) => `${i + 1}. ${formatDate(d)}`).join("\n");
    const interactive = {
      type: "list",
      header: { type: "text", text: context.serviceName || "Pilih Tanggal" },
      body: {
        text: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang baru.`,
      },
      action: {
        button: "Pilih Tanggal",
        sections: [
          {
            title: "7 Hari Kedepan",
            rows: days.map((d, i) => ({
              id: String(i + 1),
              title: formatDate(d),
            })),
          },
          {
            title: "Navigasi",
            rows: [
              {
                id: "ubah_layanan",
                title: "Ubah Layanan",
                description: "Ganti layanan yang dipilih",
              },
            ],
          },
        ],
      },
    };
    return {
      reply: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang baru.\n\n${dayList}\n\nKlik tombol *Pilih Tanggal* untuk melihat kalender.`,
      newState: "SELECT_DATE" as BotState,
      context: {
        serviceId: context.serviceId,
        serviceName: context.serviceName,
        serviceDuration: context.serviceDuration,
      },
      interactive,
    };
  }

  if (!context.date) {
    return {
      reply: "Terjadi kesalahan. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    };
  }

  const selectedDate = new Date(context.date);
  const slots = await getAvailableSlots(
    businessId,
    selectedDate,
    context.serviceDuration || 60,
  );

  const idx = parseInt(message.trim()) - 1;
  if (isNaN(idx) || idx < 0 || idx >= slots.length) {
    return {
      reply:
        "Pilihan tidak valid. Silakan ketik nomor jam yang tersedia atau ketik *menu*.",
      newState: "SELECT_TIME" as BotState,
      context,
    };
  }

  const selectedSlot = slots[idx];
  const stillAvailable = await isSlotAvailable(
    businessId,
    selectedSlot.datetime,
    context.serviceDuration || 60,
  );

  if (!stillAvailable) {
    const remaining = slots.filter((s) => s.time !== selectedSlot.time);
    if (remaining.length === 0) {
      return {
        reply:
          "Slot sudah diambil orang lain. Tidak ada slot lain tersedia untuk tanggal ini. Silakan pilih tanggal lain atau ketik *menu*.",
        newState: "SELECT_DATE" as BotState,
        context: {
          serviceId: context.serviceId,
          serviceName: context.serviceName,
          serviceDuration: context.serviceDuration,
        },
      };
    }
    const slotList = remaining.map((s, i) => `${i + 1}. ${s.time}`).join("\n");
    return {
      reply: `Maaf, slot tersebut sudah diambil. Silakan pilih jam lain:\n\n${slotList}\n\nKetik nomor jam atau *menu*.`,
      newState: "SELECT_TIME" as BotState,
      context,
    };
  }

  return {
    reply: "Terima kasih. Masukkan nama kamu untuk booking ini.",
    newState: "INPUT_NAME" as BotState,
    context: {
      ...context,
      time: selectedSlot.time,
    },
  };
}

export async function handleInputName({
  businessId,
  waNumber,
  message,
  context,
}: HandlerParams) {
  const lower = message.trim().toLowerCase();
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({
      businessId,
      waNumber,
      message,
      state: "IDLE",
      context: {},
    });
  }

  if (
    [
      "ganti tanggal",
      "ubah tanggal",
      "ganti tgl",
      "ganti jam",
      "ubah jam",
      "ganti layanan",
      "ubah layanan",
    ].includes(lower)
  ) {
    return {
      reply: "Silakan pilih tanggal yang baru.",
      newState: "SELECT_DATE" as BotState,
      context: {
        serviceId: context.serviceId,
        serviceName: context.serviceName,
        serviceDuration: context.serviceDuration,
      },
    };
  }

  const name = message.trim();
  if (name.length < 2 || /^\d+$/.test(name)) {
    return {
      reply:
        "Nama tidak valid. Masukkan minimal 2 karakter dan tidak boleh hanya angka.",
      newState: "INPUT_NAME" as BotState,
      context,
    };
  }

  const { serviceName, serviceDuration, date, time } = context;
  const bookingDate = date ? new Date(date) : new Date();
  const dateStr = bookingDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summary =
    `*Konfirmasi Booking*\n\n` +
    `Layanan: ${serviceName || "-"}\n` +
    `Tanggal: ${dateStr}\n` +
    `Jam: ${time || "-"}\n` +
    `Durasi: ${serviceDuration || "-"} menit\n` +
    `Nama: ${name}\n\n` +
    `Apakah data di atas sudah benar?`;

  const interactive = {
    type: "button",
    body: { text: summary },
    action: {
      buttons: [
        { type: "reply", reply: { id: "YA", title: "Ya" } },
        { type: "reply", reply: { id: "TIDAK", title: "Tidak" } },
      ],
    },
  };

  return {
    reply: summary,
    newState: "CONFIRM" as BotState,
    context: { ...context, customerName: name, customerWa: waNumber },
    interactive,
  };
}

export async function handleConfirm({
  businessId,
  waNumber,
  message,
  context,
}: HandlerParams) {
  const lower = message.trim().toLowerCase();

  const isYes = ["0", "ya", "yes", "konfirmasi", "confirm", "y"].includes(
    lower,
  );
  const isNo = ["1", "tidak", "no", "batal", "cancel", "n"].includes(lower);

  if (!isYes && !isNo) {
    // Re-send the confirmation with buttons instead of asking user to type
    const { serviceName, serviceDuration, date, time, customerName } = context;
    const bookingDate = date ? new Date(date) : new Date();
    const dateStr = bookingDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const summary =
      `*Konfirmasi Booking*\n\n` +
      `Layanan: ${serviceName || "-"}\n` +
      `Tanggal: ${dateStr}\n` +
      `Jam: ${time || "-"}\n` +
      `Durasi: ${serviceDuration || "-"} menit\n` +
      `Nama: ${customerName || "-"}\n\n` +
      `Apakah data di atas sudah benar?`;

    const interactive = {
      type: "button",
      body: { text: summary },
      action: {
        buttons: [
          { type: "reply", reply: { id: "YA", title: "Ya" } },
          { type: "reply", reply: { id: "TIDAK", title: "Tidak" } },
        ],
      },
    };

    return {
      reply: summary,
      newState: "CONFIRM" as BotState,
      context,
      interactive,
    };
  }

  if (isNo) {
    return {
      reply: "Booking dibatalkan. Ketik *menu* untuk kembali.",
      newState: "IDLE" as BotState,
    };
  }

  if (
    !context.serviceId ||
    !context.date ||
    !context.time ||
    !context.customerName
  ) {
    return {
      reply:
        "Data booking tidak lengkap. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    };
  }

  const bookingDate = new Date(context.date);
  const [hour, min] = context.time.split(":").map(Number);
  bookingDate.setHours(hour, min, 0, 0);

  const stillAvailable = await isSlotAvailable(
    businessId,
    bookingDate,
    context.serviceDuration || 60,
  );

  if (!stillAvailable) {
    return {
      reply:
        "Maaf, slot sudah diambil orang lain. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    };
  }

  const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  let customer = await prisma.customer.findUnique({
    where: { businessId_waNumber: { businessId, waNumber } },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: { businessId, name: context.customerName, waNumber },
    });
  }

  const booking = await prisma.booking.create({
    data: {
      businessId,
      serviceId: context.serviceId,
      customerId: customer.id,
      customerName: context.customerName,
      customerWa: waNumber,
      scheduledAt: bookingDate,
      durationMinutes: context.serviceDuration!,
      bookingCode,
      status: "CONFIRMED",
    },
    include: { service: true, business: true },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalBookings: { increment: 1 },
      lastBookingAt: new Date(),
    },
  });

  const business = booking.business;

  const scheduledDate = bookingDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const scheduledTime = bookingDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const confirmTemplate = business?.confirmTemplate;
  let confirmMessage = "";
  if (confirmTemplate) {
    confirmMessage = confirmTemplate
      .replace(/{nama_pelanggan}/g, context.customerName)
      .replace(/{layanan}/g, context.serviceName || "")
      .replace(/{tanggal}/g, scheduledDate)
      .replace(/{jam}/g, scheduledTime)
      .replace(/{nama_bisnis}/g, business?.name || "")
      .replace(/{kode_booking}/g, bookingCode);
  } else {
    confirmMessage =
      `✅ *Booking Dikonfirmasi!*\n\n` +
      `Kode Booking: *${bookingCode}*\n` +
      `Layanan: ${context.serviceName}\n` +
      `Tanggal: ${scheduledDate}\n` +
      `Jam: ${scheduledTime}\n\n` +
      `Terima kasih telah menggunakan layanan kami 🙏`;
  }

  notificationQueue
    .add("booking-status", {
      businessId,
      type: "booking_new",
      customerName: context.customerName,
      serviceName: context.serviceName,
      scheduledAt: `${scheduledDate} ${scheduledTime}`,
      bookingId: booking.id,
      status: "CONFIRMED",
    })
    .catch(() => {});

  const reminderTime = new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000);
  if (reminderTime > new Date()) {
    await prisma.reminder.create({
      data: {
        bookingId: booking.id,
        type: "DAY_BEFORE",
        scheduledAt: reminderTime,
      },
    });
  }

  const hourBeforeTime = new Date(bookingDate.getTime() - 60 * 60 * 1000);
  if (hourBeforeTime > new Date()) {
    await prisma.reminder.create({
      data: {
        bookingId: booking.id,
        type: "HOUR_BEFORE",
        scheduledAt: hourBeforeTime,
      },
    });
  }

  return {
    reply: confirmMessage,
    newState: "MAIN_MENU" as BotState,
  };
}

export const handlers: Record<
  BotState,
  (params: HandlerParams) => Promise<HandlerResult>
> = {
  IDLE: handleIdle,
  MAIN_MENU: handleMainMenu,
  BOOKING_START: handleBookingStart,
  SELECT_SERVICE: handleSelectService,
  SELECT_DATE: handleSelectDate,
  SELECT_TIME: handleSelectTime,
  INPUT_NAME: handleInputName,
  CONFIRM: handleConfirm,
  VIEW_BOOKING: handleViewBooking,
};
