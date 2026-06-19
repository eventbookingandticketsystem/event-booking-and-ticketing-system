import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  // Find smoke users
  const smokeUsers = await prisma.user.findMany({
    where: { email: { startsWith: 'smoke+' } },
    select: { id: true, email: true },
  });
  const smokeUserIds = smokeUsers.map(u => u.id);

  // Find smoke events
  const smokeEvents = await prisma.event.findMany({
    where: { title: { contains: 'Smoke Test' } },
    select: { id: true, title: true },
  });
  const smokeEventIds = smokeEvents.map(e => e.id);

  // Get orgProfile ids for cascade
  const orgProfiles = await prisma.orgProfile.findMany({
    where: { userId: { in: smokeUserIds } },
    select: { id: true },
  });
  const orgProfileIds = orgProfiles.map(p => p.id);

  // Cascade delete — order matters: children before parents
  if (smokeEventIds.length > 0) {
    // 1. Collect agent IDs for this event so we can delete scan records by agentId
    const agents = await prisma.gateAgent.findMany({
      where: { eventId: { in: smokeEventIds } },
      select: { id: true },
    });
    const agentIds = agents.map(a => a.id);
    // Delete ScanRecords by both eventId and agentId (belt + suspenders)
    await prisma.scanRecord.deleteMany({ where: { eventId: { in: smokeEventIds } } });
    if (agentIds.length > 0) {
      await prisma.scanRecord.deleteMany({ where: { agentId: { in: agentIds } } });
    }
    // 2. GateAgents can now be removed
    await prisma.gateAgent.deleteMany({ where: { eventId: { in: smokeEventIds } } });
    // 3. Tickets
    await prisma.ticket.deleteMany({ where: { eventId: { in: smokeEventIds } } });
    // 4. BookingLines — find bookings for these events first, then delete lines by bookingId
    const bookings = await prisma.booking.findMany({
      where: { eventId: { in: smokeEventIds } },
      select: { id: true },
    });
    const bookingIds = bookings.map(b => b.id);
    if (bookingIds.length > 0) {
      await prisma.bookingLine.deleteMany({ where: { bookingId: { in: bookingIds } } });
    }
    // 5. Bookings
    await prisma.booking.deleteMany({ where: { eventId: { in: smokeEventIds } } });
    // 6. Tiers
    await prisma.ticketTier.deleteMany({ where: { eventId: { in: smokeEventIds } } });
    // 7. Events
    await prisma.event.deleteMany({ where: { id: { in: smokeEventIds } } });
    console.log(`Deleted ${smokeEventIds.length} smoke event(s): ${smokeEvents.map(e => e.title).join(', ')}`);
  }

  if (smokeUserIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: smokeUserIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: smokeUserIds } } });
    await prisma.orgProfile.deleteMany({ where: { id: { in: orgProfileIds } } });
    await prisma.agentProfile.deleteMany({ where: { userId: { in: smokeUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: smokeUserIds } } });
    console.log(`Deleted ${smokeUserIds.length} smoke user(s): ${smokeUsers.map(u => u.email).join(', ')}`);
  }

  if (smokeUserIds.length === 0 && smokeEventIds.length === 0) {
    console.log('Nothing to clean up.');
  }

  console.log('✅ Cleanup complete.');
  await prisma.$disconnect();
} catch (e) {
  console.error('Cleanup failed:', e.message);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
