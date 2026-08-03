import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  private cleanPrivateKey(key: string): string {
    if (!key) return key;
    
    // Si la llave viene en Base64 puro sin formato, la decodificamos
    if (!key.includes('BEGIN PRIVATE KEY') && /^[A-Za-z0-9+/=]+$/.test(key.trim())) {
      try {
        key = Buffer.from(key.trim(), 'base64').toString('utf8');
      } catch (e) {
        // Ignorar si falla
      }
    }

    let cleaned = key.trim();
    while ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r/g, '');

    if (cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
      const header = '-----BEGIN PRIVATE KEY-----';
      const footer = '-----END PRIVATE KEY-----';
      
      let body = cleaned
        .replace(header, '')
        .replace(footer, '')
        .replace(/[\r\n\s]+/g, '');

      const chunks = body.match(/.{1,64}/g) || [];
      cleaned = `${header}\n${chunks.join('\n')}\n${footer}\n`;
    }

    return cleaned;
  }

  onModuleInit() {
    try {
      // 1. Opción más segura en Railway: JSON completo codificado en Base64 (sin saltos de línea ni caracteres corruptos)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
          const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim(), 'base64').toString('utf8');
          const serviceAccount = JSON.parse(decoded);
          if (serviceAccount.private_key) {
            serviceAccount.private_key = this.cleanPrivateKey(serviceAccount.private_key);
          }
          if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
            initializeApp({
              credential: cert(serviceAccount),
            });
            this.logger.log('🔥 Firebase Firestore inicializado con éxito desde FIREBASE_SERVICE_ACCOUNT_BASE64');
            return;
          }
        } catch (err) {
          this.logger.warn('Error al procesar FIREBASE_SERVICE_ACCOUNT_BASE64, probando alternativas...');
        }
      }

      // 2. Intentar cargar mediante la variable JSON completa tradicional (FIREBASE_SERVICE_ACCOUNT)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          let rawValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
          while ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
            rawValue = rawValue.slice(1, -1).trim();
          }

          const serviceAccount = JSON.parse(rawValue);
          if (serviceAccount.private_key) {
            serviceAccount.private_key = this.cleanPrivateKey(serviceAccount.private_key);
          }

          if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
            initializeApp({
              credential: cert(serviceAccount),
            });
            this.logger.log('🔥 Firebase Firestore inicializado con éxito desde FIREBASE_SERVICE_ACCOUNT');
            return;
          }
        } catch (jsonErr) {
          this.logger.warn('No se pudo parsear FIREBASE_SERVICE_ACCOUNT, probando variables individuales...');
        }
      }

      // 3. Intentar cargar desde variables de entorno individuales
      const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
      const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

      if (projectId && clientEmail && rawPrivateKey) {
        const privateKey = this.cleanPrivateKey(rawPrivateKey);

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

      // 4. Archivo local físico por respaldo
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