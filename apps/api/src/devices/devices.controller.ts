import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DeviceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    // req.user ahora sí contiene el rol y el tenantId real del usuario logueado
    const tenantId = req.user?.role === 'SUPERADMIN' && body.tenantId 
      ? body.tenantId 
      : req.user?.tenantId;
      
    return this.devicesService.createDevice(tenantId, body);
  }

  // 🔓 Ruta pública para que la App Móvil envíe su IMEI (NO lleva UseGuards)
  @Post('enroll')
  async enroll(@Body() body: { enrollmentCode: string; imei: string }) {
    return this.devicesService.enrollDevice(body.enrollmentCode, body.imei);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any, @Query('tenantId') queryTenantId?: string) {
    // Si es SuperAdmin y quiere ver todo o filtrar por un local específico
    if (req.user?.role === 'SUPERADMIN' && !queryTenantId) {
      return this.devicesService.getAllDevicesForSuperAdmin();
    }

    const tenantId = req.user?.role === 'SUPERADMIN' && queryTenantId ? queryTenantId : req.user?.tenantId;
    return this.devicesService.getDevicesByTenant(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { tenantId?: string; status: DeviceStatus },
  ) {
    const tenantId = req.user?.role === 'SUPERADMIN' && body.tenantId 
      ? body.tenantId 
      : req.user?.tenantId;
      
    return this.devicesService.updateStatus(tenantId, id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.devicesService.removeDevice(id);
  }
}