/**
 * seed-dashboard.mjs
 * Seeds one organizer + one published event with two tiers.
 * Leave data in place — dashboard needs it for review.
 * Safe to re-run: checks for existing seed user first.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_EMAIL  = 'seed+org@tiketi.dev';
const SEED_PHONE  = '+211912000001';
const SEED_PASS   = 'seed1234';

try {
  // ── 1. Idempotency check ─────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (existing) {
    console.log('Seed organizer already exists — skipping. DB already has data for the dashboard.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // ── 2. Create organizer user + orgProfile ────────────────────────────────
  const hash = await bcrypt.hash(SEED_PASS, 10);
  const user = await prisma.user.create({
    data: {
      name:     'Nile Live Events',
      email:    SEED_EMAIL,
      phone:    SEED_PHONE,
      password: hash,
      role:     'ORGANIZER',
    },
  });

  const org = await prisma.orgProfile.create({
    data: {
      userId:      user.id,
      orgName:     'Nile Live Events',
      contactName: 'James Majok',
      phone:       SEED_PHONE,
    },
  });

  console.log(`✅ Organizer created: ${user.email} (orgProfile: ${org.id})`);

  // ── 3. Create a published featured event ────────────────────────────────
  const eventDate = new Date('2026-12-14T18:00:00.000Z');
  const event = await prisma.event.create({
    data: {
      title:        'Juba Music Festival 2026',
      description:  'The biggest night of live music in South Sudan returns to Nyakuron. Three stages, fifteen artists, and food vendors from across Juba. Gates open at 5:00 PM. No re-entry after 9:00 PM.',
      category:     'Concert',
      venue:        'Nyakuron Cultural Centre, Juba',
      city:         'Juba',
      date:         eventDate,
      time:         '6:00 PM – 11:00 PM',
      organizer:    org.orgName,
      orgProfileId: org.id,
      status:       'PUBLISHED',
      featured:     true,
      tiers: {
        create: [
          {
            name:      'General Admission',
            price:     50,
            capacity:  1000,
            remaining: 1000,
            soldOut:   false,
            lowStock:  false,
          },
          {
            name:      'VIP',
            price:     150,
            capacity:  100,
            remaining: 12,
            soldOut:   false,
            lowStock:  true,   // low stock so the "Selling Fast" pill appears
          },
        ],
      },
    },
    include: { tiers: true },
  });

  console.log(`✅ Event created: "${event.title}" (id: ${event.id})`);
  console.log(`   Tiers: ${event.tiers.map(t => `${t.name} @ $${t.price} (${t.remaining} left)`).join(', ')}`);

  // ── 4. Second event (not featured) to populate the upcoming list ─────────
  const event2 = await prisma.event.create({
    data: {
      title:        'SSFA Football Finals 2026',
      description:  'The South Sudan Football Association national championship finals. Two top clubs compete for the national title at Juba National Stadium.',
      category:     'Football',
      venue:        'Juba National Stadium',
      city:         'Juba',
      date:         new Date('2026-11-01T15:00:00.000Z'),
      time:         '3:00 PM – 6:00 PM',
      organizer:    org.orgName,
      orgProfileId: org.id,
      status:       'PUBLISHED',
      featured:     false,
      tiers: {
        create: [
          {
            name:      'Terrace',
            price:     20,
            capacity:  5000,
            remaining: 5000,
            soldOut:   false,
            lowStock:  false,
          },
          {
            name:      'VIP Stand',
            price:     80,
            capacity:  200,
            remaining: 45,
            soldOut:   false,
            lowStock:  false,
          },
        ],
      },
    },
    include: { tiers: true },
  });

  console.log(`✅ Event created: "${event2.title}" (id: ${event2.id})`);

  // ── 5. Third event (Conference) to test the category filter ─────────────
  const event3 = await prisma.event.create({
    data: {
      title:        'South Sudan Digital Forum 2026',
      description:  'Annual gathering of South Sudan\'s technology community — startups, developers, and investors. Keynotes, workshops, and a startup pitch competition with SSP 500,000 in prizes.',
      category:     'Conference',
      venue:        'Freedom Hall, Juba',
      city:         'Juba',
      date:         new Date('2026-10-15T08:00:00.000Z'),
      time:         '8:00 AM – 6:00 PM',
      organizer:    org.orgName,
      orgProfileId: org.id,
      status:       'PUBLISHED',
      featured:     false,
      tiers: {
        create: [
          {
            name:      'Standard',
            price:     0,
            capacity:  500,
            remaining: 342,
            soldOut:   false,
            lowStock:  false,
          },
          {
            name:      'Delegate',
            price:     100,
            capacity:  100,
            remaining: 8,
            soldOut:   false,
            lowStock:  true,
          },
        ],
      },
    },
  });

  console.log(`✅ Event created: "${event3.title}" (id: ${event3.id})`);
  console.log('\n🌱 Seed complete. Dashboard should now show 3 events (1 featured + 2 upcoming).');
  console.log('   Login credentials for organizer:');
  console.log(`     Phone: ${SEED_PHONE}  |  Password: ${SEED_PASS}`);

  await prisma.$disconnect();
} catch (e) {
  console.error('Seed failed:', e.message);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
