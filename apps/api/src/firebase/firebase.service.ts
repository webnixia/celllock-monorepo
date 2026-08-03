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
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let rawValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        
        while ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
          rawValue = rawValue.slice(1, -1).trim();
        }

        const serviceAccount = JSON.parse(rawValue);

        // Asegurar que los saltos de línea de la private_key sean reales
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\r/g, '');
        }

        if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
          initializeApp({
            credential: cert(serviceAccount),
          });
          this.logger.log('🔥 Firebase Firestore inicializado con éxito desde FIREBASE_SERVICE_ACCOUNT');
          return;
        }
      }

      // Archivo local físico por respaldo
      const filePath = path.resolve(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(filePath)) {
        initializeApp({
          credential: cert(filePath),
        });
        this.logger.log('Firebase inicializado desde archivo JSON local');
        return;
      }

      this.logger.warn('No se encontraron credenciales válidas de Firebase. Inicialización omitida.');
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