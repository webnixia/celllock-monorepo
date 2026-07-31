import { OnModuleInit } from '@nestjs/common';
export declare class FirebaseService implements OnModuleInit {
    private readonly logger;
    onModuleInit(): void;
    updateDeviceStatus(token: string, status: string, payloadData?: Record<string, string>): Promise<string>;
}
