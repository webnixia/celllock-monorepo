import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseService } from '../firebase/firebase.service'; // 👈 1. Importar el servicio

@Module({
  imports: [PrismaModule],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    FirebaseService, // 👈 2. Declararlo como provider acá
  ],
  exports: [DevicesService],
})
export class DevicesModule {}