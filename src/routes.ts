import { Application } from "express";
import { healthRoutes } from "@order/routes/health.route";
import { orderRoutes } from "@order/routes/order.route";
import { notificationRoutes } from "@order/routes/notification.route";
import { verifyGatewayRequest } from "@Akihira77/jobber-shared";

const BASE_PATH = "/api/v1/order";

export function appRoutes(app: Application): void {
    app.use("", healthRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, orderRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, notificationRoutes());
}
