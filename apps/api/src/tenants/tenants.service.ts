import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Crear un nuevo Local (Tenant) junto con su Usuario Administrador
  async createTenant(data: {
    name: string;
    slug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
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
        users: {
          create: {
            name: data.adminName,
            email: data.adminEmail,
            password: hashedPassword,
            role: Role.TENANT_ADMIN, // Rol de dueño de local
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
          select: { devices: true }, // Cuántos celulares tiene cargados cada local
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Activar o Suspender un local (Por falta de pago del abono)
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
}