import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const platformAdminId = 'platform-admin-seed';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const email = 'admin@example.com';
  const password = '123456';

  if (!connectionString) {
    throw new Error('DATABASE_URL must be configured before running the seed.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('PLATFORM_ADMIN_EMAIL must be a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error(
      'PLATFORM_ADMIN_PASSWORD must be at least 12 characters long.',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = await hash(password, 12);

    await prisma.user.upsert({
      where: { id: platformAdminId },
      create: {
        id: platformAdminId,
        name: 'Platform Administrator',
        email,
        passwordHash,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        organizationId: null,
      },
      update: {
        name: 'Platform Administrator',
        email,
        passwordHash,
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        organizationId: null,
      },
    });

    console.info(`Seeded platform administrator: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Platform administrator seed failed:', error);
  process.exitCode = 1;
});
