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
      this.logger.log(`DEBUG ENV - PROJECT_ID: ${!!process.env.FIREBASE_PROJECT_ID}`);
      this.logger.log(`DEBUG ENV - CLIENT_EMAIL: ${!!process.env.FIREBASE_CLIENT_EMAIL}`);
      this.logger.log(`DEBUG ENV - PRIVATE_KEY: ${!!process.env.FIREBASE_PRIVATE_KEY}`);

      // 1. Intentar cargar desde variables de entorno individuales (Railway)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();

        // Limpieza robusta de comillas envolventes
        privateKey = privateKey.replace(/^["']|["']$/g, '');

        // Reemplazar barras invertidas con 'n' y limpiar retornos de carro por completo
        privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
        this.logger.log('🔥 Firebase Firestore inicializado con éxito desde variables de entorno');
        return;
      }

      // 1.b. Intentar cargar desde variable de entorno JSON completa (por compatibilidad)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('Firebase inicializado desde variable de entorno JSON');
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
   * Actualiza el documento del dispositivo en Firestore para que la App Android reaccione en tiempo real
   */
  async updateDeviceStatus(deviceId: string, status: string, payloadData?: Record<string, string>) {
    if (getApps().length === 0) {
      this.logger.warn(`Firebase no está inicializado. Se omitió el envío a ${deviceId}`);
      return null;
    }

    try {
      const db = getFirestore();

      // Actualiza o crea el documento en la colección 'devices' con el ID (IMEI / Android ID)
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