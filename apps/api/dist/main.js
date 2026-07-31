"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const port = process.env.PORT || 3005;
    const globalPrefix = process.env.API_PREFIX || 'api/v1';
    app.setGlobalPrefix(globalPrefix);
    await app.listen(port);
    common_1.Logger.log(`🚀 App backend corriendo en: http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map