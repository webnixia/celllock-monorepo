"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const fs = require("fs");
const path = require("path");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    constructor() {
        this.logger = new common_1.Logger(FirebaseService_1.name);
    }
    onModuleInit() {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)(serviceAccount),
                });
                this.logger.log('Firebase inicializado desde variable de entorno');
                return;
            }
            const filePath = path.resolve(process.cwd(), 'firebase-service-account.json');
            if (fs.existsSync(filePath)) {
                (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)(filePath),
                });
                this.logger.log('Firebase inicializado desde archivo JSON');
                return;
            }
            this.logger.warn('No se encontraron credenciales de Firebase. Inicialización omitida.');
        }
        catch (error) {
            this.logger.error('Error al intentar inicializar Firebase:', error);
        }
    }
    async updateDeviceStatus(token, status, payloadData) {
        if ((0, app_1.getApps)().length === 0) {
            this.logger.warn(`Firebase no está inicializado. Se omitió el envío a ${token}`);
            return null;
        }
        try {
            const message = {
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
            const response = await (0, messaging_1.getMessaging)().send(message);
            this.logger.log(`Mensaje enviado con éxito a Firebase: ${response}`);
            return response;
        }
        catch (error) {
            this.logger.error(`Error al enviar mensaje push a Firebase para el token ${token}:`, error);
            throw error;
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)()
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map