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
      const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
      let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

      if (projectId && clientEmail && privateKey) {
        // Limpiar comillas envolventes si las hubiera
        while ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
          privateKey = privateKey.slice(1, -1).trim();
        }

        // 1. Reemplazar escapes lógicos de saltos de línea
        privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r/g, '');

        // 2. RECONSTRUCTOR AUTOMÁTICO: Si Railway aplanó la llave en una sola línea, la reconstruimos por bloques PEM
        if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && !privateKey.includes('\n')) {
          const header = '-----BEGIN PRIVATE KEY-----';
          const footer = '-----END PRIVATE KEY-----';
          let body = privateKey.replace(header, '').replace(footer, '').replace(/\s+/g, '');
          const chunks = body.match(/.{1,64}/g) || [];
          privateKey = `${header}\n${chunks.join('\n')}\n${footer}`;
        }

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

        this.logger.log('🔥 Firebase Firestore inicializado con éxito desde variables individuales');
        return;
      }

      // Respaldo por archivo local físico
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