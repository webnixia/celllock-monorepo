import { Injectable, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: Firestore;

  onModuleInit() {
    if (getApps().length === 0) {
      const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
      initializeApp({
        credential: cert(serviceAccountPath),
      });
    }
    this.db = getFirestore();
  }

  async updateDeviceStatus(deviceId: string, status: string) {
    let firestoreStatus = 'AL_DIA';
    if (status === 'LOCKED') firestoreStatus = 'EN_MORA';
    if (status === 'UNENROLLED') firestoreStatus = 'LIBERADO';

    await this.db.collection('devices').doc(deviceId).set(
      {
        status: firestoreStatus,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
}