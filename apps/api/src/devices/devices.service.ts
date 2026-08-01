import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
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
   * Resuelve el tenantId de forma estricta y segura para cada local
   */
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (!tenantId) {
      throw new BadRequestException('El identificador del local (tenantId) es obligatorio.');
    }

    const tenantExists = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenantExists) {
      throw new NotFoundException('El local especificado no existe.');
    }

    return tenantExists.id;
  }

  // 1. Crear Venta / Registro de Dispositivo asociado estrictamente a su Tenant
  async createDevice(tenantId: string, data: any) {
    try {
      const effectiveTenantId = await this.resolveTenantId(tenantId);

      const tenant = (await this.prisma.tenant.findUnique({
        where: { id: effectiveTenantId },
        include: { _count: { select: { devices: true } } },
      })) as any;

      if (!tenant || !tenant.isActive) {
        throw new ConflictException('El local está suspendido o no existe.');
      }

      if (tenant._count.devices >= tenant.deviceLimit) {
        throw new ConflictException(
          `Has alcanzado el límite de tu plan (${tenant.deviceLimit} equipos).`
        );
      }

      if (data.imei) {
        const existing = await this.prisma.device.findUnique({
          where: { imei: data.imei },
        });
        if (existing) {
          throw new ConflictException('Ya existe un dispositivo registrado con este IMEI');
        }
      }

      const enrollmentCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;

      // 🛠️ Limpiador seguro de números
      const parseNum = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return val;
        const clean = String(val)
          .replace(/[^\d,.-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const parsed = Number(clean);
        return isNaN(parsed) ? null : parsed;
      };

      // 🛠️ Limpiador y formateador de fecha
      let parsedDueDate = null;
      if (data.dueDate) {
        if (typeof data.dueDate === 'string' && data.dueDate.includes('/')) {
          const [day, month, year] = data.dueDate.split('/');
          parsedDueDate = new Date(`${year}-${month}-${day}`);
        } else {
          parsedDueDate = new Date(data.dueDate);
        }
        if (isNaN(parsedDueDate.getTime())) {
          parsedDueDate = null;
        }
      }

      const device = await this.prisma.device.create({
        data: {
          model: data.model,
          imei: data.imei || null,
          enrollmentCode,
          status: data.imei ? DeviceStatus.ACTIVE : DeviceStatus.PENDING_ENROLLMENT,

          buyerName: data.buyerName || null,
          buyerDni: data.buyerDni || null,
          buyerPhone: data.buyerPhone || null,

          price: parseNum(data.price),
          downPayment: parseNum(data.downPayment),
          installmentAmount: parseNum(data.installmentAmount),
          totalInstallments: parseNum(data.totalInstallments),
          paidInstallments: parseNum(data.paidInstallments) || 0,
          paymentFrequency: data.paymentFrequency || 'MENSUAL',
          dueDate: parsedDueDate,
          gracePeriodDays: parseNum(data.gracePeriodDays) || 3,
          autoLockEnabled: data.autoLockEnabled !== undefined ? Boolean(data.autoLockEnabled) : true,

          tenantId: effectiveTenantId, // 🔒 Estrictamente ligado al local correcto
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      try {
        const docId = device.imei || device.id;
        await this.firebaseService.updateDeviceStatus(docId, device.status);
      } catch (fbError) {
        console.error('Advertencia: No se pudo sincronizar con Firebase:', fbError);
      }

      return device;
    } catch (error: any) {
      console.error('ERROR AL CREAR DISPOSITIVO:', error);
      throw new BadRequestException(error?.message || 'Error interno al registrar la venta');
    }
  }

  // 2. Endpoint de auto-vinculación
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

    try {
      await this.firebaseService.updateDeviceStatus(imei, 'ACTIVE');
    } catch (e) {
      console.error('Firebase sync error on enroll:', e);
    }

    return updatedDevice;
  }

  // 3. Listar TODOS los dispositivos para el SUPERADMIN
  async getAllDevicesForSuperAdmin() {
    return this.prisma.device.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Listar dispositivos exclusivamente por tenant
  async getDevicesByTenant(tenantId: string) {
    const effectiveTenantId = await this.resolveTenantId(tenantId);
    return this.prisma.device.findMany({
      where: { tenantId: effectiveTenantId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 5. Cambiar estado
  async updateStatus(tenantId: string, deviceId: string, status: DeviceStatus) {
    const effectiveTenantId = await this.resolveTenantId(tenantId);
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, tenantId: effectiveTenantId },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado en este local');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: deviceId },
      data: { status, lastSeenAt: new Date() },
    });

    try {
      const docId = updatedDevice.imei || updatedDevice.id;
      await this.firebaseService.updateDeviceStatus(docId, status);
    } catch (e) {
      console.error('Firebase sync error on status update:', e);
    }

    return updatedDevice;
  }

  // 6. Borrar dispositivo
  async removeDevice(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (device) {
      try {
        const docId = device.imei || device.id;
        await this.firebaseService.updateDeviceStatus(docId, 'UNENROLLED');
      } catch (e) {
        console.error('Firebase sync error on remove:', e);
      }
    }
    return this.prisma.device.delete({ where: { id: device?.id } });
  }
}