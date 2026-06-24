import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

export async function syncContactsFromZernio(businessId: string): Promise<{ synced: number }> {
  if (!process.env.ZERNIO_API_KEY) return { synced: 0 }

  const zernio = new ZernioClient()

  const contacts = await zernio.listContacts("whatsapp")
  let synced = 0

  for (const c of contacts) {
    const waNumber = c.platformIdentifier || c.displayIdentifier
    if (!waNumber) continue

    const contact = await prisma.contact.upsert({
      where: { businessId_waNumber: { businessId, waNumber } },
      update: {
        displayName: c.name || waNumber,
        avatarUrl: c.avatarUrl,
        lastInteractionAt: new Date(),
      },
      create: {
        businessId,
        waNumber,
        displayName: c.name || waNumber,
        avatarUrl: c.avatarUrl,
      },
    })

    const channelId = c.id || waNumber
    await prisma.contactChannel.upsert({
      where: { contactId_channelId: { contactId: contact.id, channelId } },
      update: {},
      create: {
        contactId: contact.id,
        channelId,
        channelType: "whatsapp",
      },
    })

    synced++
  }

  return { synced }
}
