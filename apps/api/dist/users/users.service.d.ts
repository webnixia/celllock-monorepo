import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    registerTenantWithAdmin(data: {
        tenantName: string;
        tenantSlug: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
    }): Promise<{
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    findByEmail(email: string): Promise<{
        tenant: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
