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
    const tenantId = req.user?.role === 'SUPERADMIN' && body.tenantId 
      ? body.tenantId 
      : req.user?.tenantId;
      
    return this.devicesService.createDevice(tenantId, body);
  }

  // 🔓 Ruta pública para que la App Móvil envíe su IMEI
  @Post('enroll')
  async enroll(@Body() body: { enrollmentCode: string; imei: string }) {
    return this.devicesService.enrollDevice(body.enrollmentCode, body.imei);
  }

@UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Req() req: any, 
    @Query('tenantId') queryTenantId?: string,
    @Query('global') global?: string,
  ) {
    // 🛡️ Si es SuperAdmin:
    if (req.user?.role === 'SUPERADMIN') {
      // Si pide ver todo globalmente
      if (global === 'true') {
        return this.devicesService.getAllDevicesForSuperAdmin();
      }
      // Si selecciona un local específico para ver sus detalles
      if (queryTenantId) {
        return this.devicesService.getDevicesByTenant(queryTenantId);
      }
      // Por defecto, el admin principal no mezcla dispositivos en su propio dashboard personal
      return []; 
    }

    // Para los usuarios normales de un local
    const tenantId = queryTenantId || req.user?.tenantId;
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