import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@walkingaudit.ie' },
    update: {},
    create: {
      email: 'admin@walkingaudit.ie',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: 'system_admin',
      emailVerified: true,
      organization: 'NTA',
      county: 'Dublin',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create coordinator user
  const coordinatorPassword = await bcrypt.hash('coordinator123', 12);
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@walkingaudit.ie' },
    update: {},
    create: {
      email: 'coordinator@walkingaudit.ie',
      passwordHash: coordinatorPassword,
      name: 'Test Coordinator',
      role: 'coordinator',
      emailVerified: true,
      organization: 'Test Organization',
      county: 'Dublin',
    },
  });

  console.log('✅ Created coordinator user:', coordinator.email);

  // Create auditor user
  const auditorPassword = await bcrypt.hash('auditor123', 12);
  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@walkingaudit.ie' },
    update: {},
    create: {
      email: 'auditor@walkingaudit.ie',
      passwordHash: auditorPassword,
      name: 'Test Auditor',
      role: 'auditor',
      emailVerified: true,
      organization: 'Community Group',
      county: 'Dublin',
    },
  });

  console.log('✅ Created auditor user:', auditor.email);

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

