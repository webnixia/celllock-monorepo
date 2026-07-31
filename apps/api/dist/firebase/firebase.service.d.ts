import { OnModuleInit } from '@nestjs/common';
export declare class FirebaseService implements OnModuleInit {
    private db;
    onModuleInit(): void;
    updateDeviceStatus(deviceId: string, status: string): Promise<void>;
}
