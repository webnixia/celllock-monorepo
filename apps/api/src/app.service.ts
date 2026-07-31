import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthStatus() {
    return {
      status: 'ok',
      service: 'CellLock Backend API',
      timestamp: new Date().toISOString(),
    };
  }
}