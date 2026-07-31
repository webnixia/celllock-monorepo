"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const devices_service_1 = require("./devices.service");
describe('DevicesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [devices_service_1.DevicesService],
        }).compile();
        service = module.get(devices_service_1.DevicesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=devices.service.spec.js.map