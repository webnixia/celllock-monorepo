import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // Listar todos los locales
  @Get()
  async findAll(@Req() req: any) {
    return this.tenantsService.findAll();
  }

  // Crear un nuevo local + su admin
  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      slug: string;
      adminName: string;
      adminEmail: string;
      adminPassword: string;
    },
  ) {
    return this.tenantsService.createTenant(body);
  }

  // Suspender o activar un local
  @Patch(':id/status')
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tenantsService.toggleStatus(id, isActive);
  }
}