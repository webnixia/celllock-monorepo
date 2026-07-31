import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body()
    body: {
      tenantName: string;
      tenantSlug: string;
      adminName: string;
      adminEmail: string;
      adminPassword: string;
    },
  ) {
    return this.usersService.registerTenantWithAdmin(body);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(body.email, body.password);
  }
}