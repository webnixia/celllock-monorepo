import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Crear un nuevo Local (Tenant) junto con su Usuario Administrador y Plan SaaS
  async createTenant(data: {
    name: string;
    slug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    monthlyFee?: number;
    deviceLimit?: number;
    dueDate?: string;
  }) {
    // Verificar si el slug ya existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });
    if (existingTenant) {
      throw new ConflictException('Ya existe un local con ese identificador (slug)');
    }

    // Verificar si el email del usuario ya está registrado
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('El correo del administrador ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    // Crear el Tenant y el Usuario Administrador en una sola transacción
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        monthlyFee: data.monthlyFee ? Number(data.monthlyFee) : 50000,
        deviceLimit: data.deviceLimit ? Number(data.deviceLimit) : 10,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        users: {
          create: {
            name: data.adminName,
            email: data.adminEmail,
            password: hashedPassword,
            role: Role.TENANT_ADMIN,
          },
        },
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return tenant;
  }

  // 2. Listar todos los locales (Para tu vista de SuperAdmin)
  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Activar o Suspender un local
  async toggleStatus(id: string, isActive: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Local no encontrado');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive },
    });
  }

  // 4. Eliminar un local junto con sus dispositivos y usuarios asociados de forma segura
  async removeTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Local no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.device.deleteMany({ where: { tenantId: id } });
      await tx.user.deleteMany({ where: { tenantId: id } });
      return tx.tenant.delete({ where: { id } });
    });
  }
}