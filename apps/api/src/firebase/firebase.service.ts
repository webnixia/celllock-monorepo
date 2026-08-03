import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      // Credenciales embebidas directamente en TypeScript: 
      // Se compilan automáticamente sin problemas de rutas ni variables de entorno rotas en Railway.
      const serviceAccount = {
        type: "service_account",
        project_id: "controlcell-saas",
        private_key_id: "30cda9b48cf236b1fb51a5ad343a52e51fb5d502",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD3hnH+N9f9BZ2W\nRVKN9GCWfvORn+xVHPparPt3ZS5krQayS2zZkoUHhLU/jQ0/NW3xtbGubNBbR9Nr\ngxwGyqsthVEWM84b3lIVyLeGhGKJBCRoplZgHz34glokVubdNiAOCYIX0cHbLdZd\nvc555yv38pfstsgkPbrBW8d24NXO4C0LF/zV2OJvXoVlmfTdF/XGbiidHLJurJl4\ns0HtAcyox6LmYwEVbgAX71y3jokAS4YKhj2uROmu4RJnAODWm4SvTesA60Q0FXql\ndnqhCtKZQ47IksEH8PAmeWkjQT4YTtDeCoYcr/vPSbW2Jw+FAcO/GAswqt5RgOBt\nrxd0EgSTAgMBAAECggEAOKHjofD/822d/Rw2Q7FWighYzQhEh8K+CxIJ5Ora/wDR\nh+iW6n7J/grgdz5b+grM8WELWqed0kywNCiGuI0VNjCK+WP388tdh4tpZhcS/lta\nwzDPkWWEhb+5RRg28QTpt5x4Td/ZlT67Da6YN67rEetI1EmLqDMRcB0CGZJeiNqx\ncWoW34Z93Y1e4kkHmjY0BRtBwWgM5SiDgUser8qPKu5ufh5qF539NWEzAD2sJTdE\nHZFdTGnAXjy+V27ZGD/C/+E84wWU0mdzezKVghMOGFQ/ri9OiI2TX75WRwtYN8jB\nc0OVwOSZsEzMbPCwiuym7Zfyix/8WojTIpwHTY5LwQKBgQD+e/eKEH+KmWmgaFcF\+6gzsd7q2PHwtmsGV97M+kb45dQwwfAsb9pSN43v+sH7KGUrZL3PXsRVzMbdtIAz\nqLUpQKn/EIHycHXh1hS1Psj88AksosfspVNUM9hmAT3fEILFkKFiuVO2NNjw4g4O\nn6wOdvAETFYc4nWROXUMWghCwQKBgQD4/94FbOV/IwueoQ1TeF1S7iY2Aytf7lYR\nzYSDGmcwCEYdQUK9vAAynLjdpEviyqcaDhTv3RzgIY9+2bulWYYLZoJyE5/2xjSP\nZn5HgJ7LNuKCRX837DrpbYQqy5ix8WOoAYMslQ/tzIYu2OkHY+BB6EkT6KZoQMPU\np9mvbVxgUwKBgQCCPeXZlkoAIDXr75qiKELUejMRVIi2XlX2ACC6HVkXZ2Cqt4b4\n5yIANAiDin2e0fS9OajfKawoEU6yBwAZ8D0PaNXYAZXQA3iBZXRhsklhEmRPoNvb\nJF26WXJl+jq1IBkdjcDa6uiJ9xAUcE0rdNK08HA0cvEbhVcQRSy/bpCNwQKBgFJx\nTU6Yjqf4r4k3I9VmPegOZ+JsTDk4DZE3iFRMMqwpoSVgjTuK+rnHQEJKesG9fXRY\nA0CkAkKHeh5y8vk9We9+YmRo8Qbg+1gbhGYiRPFd28NsRUH72kmddCxDOux30xo2\nXfst45dFp4vtT8KdpAvOYBvSZP6RqwVHCgFWgUZ3AoGBANwcxS0Qwpa7b7uG1St4\EF7SJC2gZzXyhLo9Em2I3NSho3izQYIXQdAcfgRvxASfk4WwWpOs6eLoX7rDBHA1\nYO1fzJxnGG7eIHEeNH2N6Skarj/ait9g9XyywMeQwssKJ4gNxothqTgJjJ+G469A\nSvDtnsucWrUjg2qT5SxV5dOG\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@controlcell-saas.iam.gserviceaccount.com",
        client_id: "118270785971606681456",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40controlcell-saas.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      initializeApp({
        credential: cert(serviceAccount as any),
      });

      this.logger.log('🔥 Firebase Firestore inicializado con éxito mediante credenciales embebidas');
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