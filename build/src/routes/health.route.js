"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const health_1 = require("../controllers/health");
const router = express_1.default.Router();
function healthRoutes() {
    router.get("/order-health", health_1.health);
    return router;
}
exports.healthRoutes = healthRoutes;
//# sourceMappingURL=health.route.js.map