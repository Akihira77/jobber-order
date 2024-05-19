import express, { Router } from "express";
import * as orderController from "@order/controllers/order.controller";

const router = express.Router();

export function notificationRoutes(): Router {
    router.get(
        "/notifications/:userToName",
        orderController.findNotificationsByUserTo
    );
    router.put(
        "/notification/mark-as-read",
        orderController.updateNotificationReadStatus
    );

    return router;
}
