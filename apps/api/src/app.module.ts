import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, DevicesModule, TenantsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}