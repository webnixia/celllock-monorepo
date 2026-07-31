import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres_dev_password@localhost:5432/celllock_db?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Iniciando siembra de datos (Seed)...');

  const hashedPassword = await bcrypt.hash('Admin1234*', 10);

  // 1. Crear o buscar un Tenant Master para que el SuperAdmin cumpla con la relación
  let masterTenant = await prisma.tenant.findUnique({
    where: { slug: 'system-master' },
  });

  if (!masterTenant) {
    masterTenant = await prisma.tenant.create({
      data: {
        name: 'System Master Org',
        slug: 'system-master',
      } as any,
    });
  }

  // 2. Crear el usuario SUPERADMIN Global vinculado al Tenant Master
  const superAdminEmail = 'admin@controlcell.com';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin Master',
        email: superAdminEmail,
        password: hashedPassword,
        role: Role.SUPERADMIN,
        tenantId: masterTenant.id,
      } as any,
    });
    console.log('👑 SuperAdmin creado: admin@controlcell.com / Admin1234*');
  } else {
    console.log('👑 El SuperAdmin ya existía.');
  }

  // 3. Crear un Local de Prueba y su Administrador de Local
  const tenantSlug = 'local-central';
  let tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Local Central Celulares',
        slug: tenantSlug,
        users: {
          create: {
            name: 'Dueño Local Central',
            email: 'local@controlcell.com',
            password: hashedPassword,
            role: Role.TENANT_ADMIN,
          },
        },
      } as any,
    });
    console.log('🏪 Local de prueba creado: Local Central Celulares');
    console.log('👤 Admin de local creado: local@controlcell.com / Admin1234*');
  } else {
    console.log('🏪 El local de prueba ya existía.');
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });