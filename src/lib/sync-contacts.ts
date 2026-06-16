import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

export async function syncContactsFromZernio(businessId: string): Promise<{ synced: number }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { zernioApiKey: true },
  })

  if (!business?.zernioApiKey) return { synced: 0 }

  const apiKey = decryptApiKey(business.zernioApiKey)
  const zernio = new ZernioClient(apiKey)

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
