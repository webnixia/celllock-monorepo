import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { DeviceStatus } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Resuelve el tenantId o crea uno de demostración si la base de datos está vacía
   */
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) {
      const tenantExists = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (tenantExists) return tenantExists.id;
    }

    const firstTenant = await this.prisma.tenant.findFirst();
    if (firstTenant) {
      return firstTenant.id;
    }

    const defaultTenant = await this.prisma.tenant.create({
      data: {
        id: tenantId || 'tenant-demo-id',
        name: 'ControlCell Demo Org',
        slug: 'controlcell-demo',
      },
    });

    return defaultTenant.id;
  }

  // 1. Crear Venta / Registro de Dispositivo
  async createDevice(tenantId: string, data: any) {
    const effectiveTenantId = await this.resolveTenantId(tenantId);

    if (data.imei) {
      const existing = await this.prisma.device.findUnique({
        where: { imei: data.imei },
      });
      if (existing) {
        throw new ConflictException('Ya existe un dispositivo registrado con este IMEI');
      }
    }

    const enrollmentCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;

    const device = await this.prisma.device.create({
      data: {
        model: data.model,
        imei: data.imei || null,
        enrollmentCode,
        status: data.imei ? DeviceStatus.ACTIVE : DeviceStatus.PENDING_ENROLLMENT,

        buyerName: data.buyerName || null,
        buyerDni: data.buyerDni || null,
        buyerPhone: data.buyerPhone || null,

        price: data.price ? Number(data.price) : null,
        downPayment: data.downPayment ? Number(data.downPayment) : null,
        installmentAmount: data.installmentAmount ? Number(data.installmentAmount) : null,
        totalInstallments: data.totalInstallments ? Number(data.totalInstallments) : null,
        paidInstallments: data.paidInstallments ? Number(data.paidInstallments) : 0,
        paymentFrequency: data.paymentFrequency || 'MENSUAL',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        gracePeriodDays: data.gracePeriodDays ? Number(data.gracePeriodDays) : 3,
        autoLockEnabled: data.autoLockEnabled !== undefined ? Boolean(data.autoLockEnabled) : true,

        tenantId: effectiveTenantId,
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Sincronizar en tiempo real con Firebase
    const docId = device.imei || device.id;
    await this.firebaseService.updateDeviceStatus(docId, device.status);

    return device;
  }

  // 2. Endpoint de auto-vinculación (Público / Desde la App Android)
  async enrollDevice(enrollmentCode: string, imei: string) {
    const device = await this.prisma.device.findFirst({
      where: { enrollmentCode },
    });

    if (!device) {
      throw new NotFoundException('Código de vinculación inválido');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        imei,
        status: DeviceStatus.ACTIVE,
        lastSeenAt: new Date(),
      },
    });

    await this.firebaseService.updateDeviceStatus(imei, 'ACTIVE');

    return updatedDevice;
  }

  // 3. Listar TODOS los dispositivos para el SUPERADMIN (con datos del local)
  async getAllDevicesForSuperAdmin() {
    return this.prisma.device.findMany({
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Listar dispositivos por tenant para los locales
  async getDevicesByTenant(tenantId: string) {
    const effectiveTenantId = await this.resolveTenantId(tenantId);
    return this.prisma.device.findMany({
      where: { tenantId: effectiveTenantId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 5. Cambiar estado (Bloquear / Desbloquear)
  async updateStatus(tenantId: string, deviceId: string, status: DeviceStatus) {
    const effectiveTenantId = await this.resolveTenantId(tenantId);
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, tenantId: effectiveTenantId },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: deviceId },
      data: { status, lastSeenAt: new Date() },
    });

    // 🚀 Sincronizar en tiempo real con Firestore
    const docId = updatedDevice.imei || updatedDevice.id;
    await this.firebaseService.updateDeviceStatus(docId, status);

    return updatedDevice;
  }

  // 6. Borrar dispositivo
  async removeDevice(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (device) {
      const docId = device.imei || device.id;
      await this.firebaseService.updateDeviceStatus(docId, 'UNENROLLED');
    }
    return this.prisma.device.delete({ where: { id } });
  }
}