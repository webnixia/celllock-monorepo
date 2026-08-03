import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      // Buscar el archivo JSON local en la raíz de la API o del monorepo
      const filePath = path.resolve(process.cwd(), 'firebase-service-account.json');
      const altFilePath = path.resolve(__dirname, '../../firebase-service-account.json');

      const targetPath = fs.existsSync(filePath) ? filePath : fs.existsSync(altFilePath) ? altFilePath : null;

      if (targetPath) {
        initializeApp({
          credential: cert(targetPath),
        });
        this.logger.log('🔥 Firebase Firestore inicializado con éxito desde el archivo local de la cuenta de servicio');
        return;
      }

      this.logger.error('❌ No se encontró el archivo firebase-service-account.json en el servidor.');
    } catch (error) {
      this.logger.error('Error crítico al inicializar Firebase:', error);
    }
  }

  /**
   * Actualiza el documento del dispositivo en Firestore para que la App Android reaccione en tiempo real
   */
  async updateDeviceStatus(deviceId: string, status: string, payloadData?: Record<string, string>) {
    if (getApps().length === 0) {
      this.logger.warn(`Firebase no está inicializado. Se omitió el envío a ${deviceId}`);
      return null;
    }

    try {
      const db = getFirestore();

      await db.collection('devices').doc(deviceId).set(
        {
          status: status,
          updatedAt: new Date().toISOString(),
          ...(payloadData || {}),
        },
        { merge: true },
      );

      this.logger.log(`Documento Firestore actualizado para ${deviceId} -> Estado: ${status}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al actualizar Firestore para el dispositivo ${deviceId}:`, error);
      throw error;
    }
  }
}