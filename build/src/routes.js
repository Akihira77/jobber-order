"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = void 0;
const health_route_1 = require("./routes/health.route");
const order_route_1 = require("./routes/order.route");
const notification_route_1 = require("./routes/notification.route");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const BASE_PATH = "/api/v1/order";
function appRoutes(app) {
    app.use("", (0, health_route_1.healthRoutes)());
    app.use(BASE_PATH, jobber_shared_1.verifyGatewayRequest, (0, order_route_1.orderRoutes)());
    app.use(BASE_PATH, jobber_shared_1.verifyGatewayRequest, (0, notification_route_1.notificationRoutes)());
}
exports.appRoutes = appRoutes;
//# sourceMappingURL=routes.js.map