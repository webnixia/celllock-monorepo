"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const path = require("path");
let FirebaseService = class FirebaseService {
    onModuleInit() {
        if ((0, app_1.getApps)().length === 0) {
            const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccountPath),
            });
        }
        this.db = (0, firestore_1.getFirestore)();
    }
    async updateDeviceStatus(deviceId, status) {
        let firestoreStatus = 'AL_DIA';
        if (status === 'LOCKED')
            firestoreStatus = 'EN_MORA';
        if (status === 'UNENROLLED')
            firestoreStatus = 'LIBERADO';
        await this.db.collection('devices').doc(deviceId).set({
            status: firestoreStatus,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)()
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map