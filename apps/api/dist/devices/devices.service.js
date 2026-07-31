"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const firebase_service_1 = require("../firebase/firebase.service");
const client_1 = require("@prisma/client");
let DevicesService = class DevicesService {
    constructor(prisma, firebaseService) {
        this.prisma = prisma;
        this.firebaseService = firebaseService;
    }
    async resolveTenantId(tenantId) {
        if (tenantId) {
            const tenantExists = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            if (tenantExists)
                return tenantExists.id;
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
    async createDevice(tenantId, data) {
        const effectiveTenantId = await this.resolveTenantId(tenantId);
        if (data.imei) {
            const existing = await this.prisma.device.findUnique({ where: { imei: data.imei } });
            if (existing)
                throw new common_1.ConflictException('Ya existe un dispositivo registrado con este IMEI');
        }
        const enrollmentCode = `CC-${Math.floor(100000 + Math.random() * 900000)}`;
        const device = await this.prisma.device.create({
            data: {
                model: data.model,
                imei: data.imei || null,
                enrollmentCode,
                status: data.imei ? client_1.DeviceStatus.ACTIVE : client_1.DeviceStatus.PENDING_ENROLLMENT,
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
        });
        const docId = device.imei || device.id;
        await this.firebaseService.updateDeviceStatus(docId, device.status);
        return device;
    }
    async enrollDevice(enrollmentCode, imei) {
        const device = await this.prisma.device.findFirst({
            where: { enrollmentCode },
        });
        if (!device) {
            throw new common_1.NotFoundException('Código de vinculación inválido');
        }
        const updatedDevice = await this.prisma.device.update({
            where: { id: device.id },
            data: {
                imei,
                status: client_1.DeviceStatus.ACTIVE,
                lastSeenAt: new Date(),
            },
        });
        await this.firebaseService.updateDeviceStatus(imei, 'ACTIVE');
        return updatedDevice;
    }
    async getDevicesByTenant(tenantId) {
        const effectiveTenantId = await this.resolveTenantId(tenantId);
        return this.prisma.device.findMany({
            where: { tenantId: effectiveTenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(tenantId, deviceId, status) {
        const effectiveTenantId = await this.resolveTenantId(tenantId);
        const device = await this.prisma.device.findFirst({
            where: { id: deviceId, tenantId: effectiveTenantId },
        });
        if (!device)
            throw new common_1.NotFoundException('Dispositivo no encontrado');
        const updatedDevice = await this.prisma.device.update({
            where: { id: deviceId },
            data: { status, lastSeenAt: new Date() },
        });
        const docId = updatedDevice.imei || updatedDevice.id;
        await this.firebaseService.updateDeviceStatus(docId, status);
        return updatedDevice;
    }
    async removeDevice(id) {
        const device = await this.prisma.device.findUnique({ where: { id } });
        if (device) {
            const docId = device.imei || device.id;
            await this.firebaseService.updateDeviceStatus(docId, 'UNENROLLED');
        }
        return this.prisma.device.delete({ where: { id } });
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        firebase_service_1.FirebaseService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map