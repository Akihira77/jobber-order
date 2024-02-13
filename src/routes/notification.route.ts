import express, { Router } from "express";
import * as get from "@order/controllers/notification/get";
import * as update from "@order/controllers/notification/update";

const router = express.Router();

export function notificationRoutes(): Router {
    router.get("/notification/:userId", get.notifications);

    router.put("/notification/mark-as-read", update.notificationReadStatus);

    return router;
}
