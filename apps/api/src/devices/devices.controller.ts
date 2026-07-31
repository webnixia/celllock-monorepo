import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DeviceStatus } from '@prisma/client';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || body.tenantId || 'tenant-demo-id';
    return this.devicesService.createDevice(tenantId, body);
  }

  // Ruta pública para que la App Móvil envíe su IMEI al escanear el código/QR
  @Post('enroll')
  async enroll(@Body() body: { enrollmentCode: string; imei: string }) {
    return this.devicesService.enrollDevice(body.enrollmentCode, body.imei);
  }

@Get()
  async findAll(@Req() req: any, @Query('tenantId') queryTenantId?: string) {
    const tenantId = req.user?.tenantId || queryTenantId || 'tenant-demo-id';
    return this.devicesService.getDevicesByTenant(tenantId);
  }
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { tenantId?: string; status: DeviceStatus },
  ) {
    const tenantId = req.user?.tenantId || body.tenantId || 'tenant-demo-id';
    return this.devicesService.updateStatus(tenantId, id, body.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.devicesService.removeDevice(id);
  }
}