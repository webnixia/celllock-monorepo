import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly usersService;
    private readonly authService;
    constructor(usersService: UsersService, authService: AuthService);
    register(body: {
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
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            tenant: {
                id: string;
                name: string;
                slug: string;
            };
        };
    }>;
}
