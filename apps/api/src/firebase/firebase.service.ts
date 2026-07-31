import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      // 1. Intentar cargar desde variable de entorno
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase inicializado desde variable de entorno');
        return;
      }

      // 2. Intentar cargar desde archivo físico si existe
      const filePath = path.resolve(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(filePath)) {
        initializeApp({
          credential: cert(filePath),
        });
        this.logger.log('Firebase inicializado desde archivo JSON');
        return;
      }

      this.logger.warn('No se encontraron credenciales de Firebase. Inicialización omitida.');
    } catch (error) {
      this.logger.error('Error al intentar inicializar Firebase:', error);
    }
  }

  /**
   * Método para enviar notificaciones de actualización de estado (Bloquear/Desbloquear) al dispositivo
   */
  async updateDeviceStatus(token: string, status: string, payloadData?: Record<string, string>) {
    if (getApps().length === 0) {
      this.logger.warn(`Firebase no está inicializado. Se omitió el envío a ${token}`);
      return null;
    }

    try {
      const message: Message = {
        token,
        data: {
          status,
          ...(payloadData || {}),
        },
        notification: {
          title: 'ControlCell - Estado de Dispositivo',
          body: `El estado del dispositivo ha cambiado a: ${status}`,
        },
      };

      const response = await getMessaging().send(message);
      this.logger.log(`Mensaje enviado con éxito a Firebase: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Error al enviar mensaje push a Firebase para el token ${token}:`, error);
      throw error;
    }
  }
}