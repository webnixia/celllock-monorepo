import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async registerTenantWithAdmin(data: {
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) {
    // 1. Verificar si el email o el slug ya existen
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });
    if (existingTenant) {
      throw new ConflictException('El identificador (slug) de la empresa ya existe');
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    // 3. Crear Tenant y Usuario Administrador en una sola transacción
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug.toLowerCase(),
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          role: Role.TENANT_ADMIN,
          tenantId: tenant.id,
        },
      });

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
  }
}