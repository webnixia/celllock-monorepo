"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const devices_controller_1 = require("./devices.controller");
describe('DevicesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [devices_controller_1.DevicesController],
        }).compile();
        controller = module.get(devices_controller_1.DevicesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=devices.controller.spec.js.map