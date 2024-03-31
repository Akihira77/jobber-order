import express, { Router } from "express";
import * as get from "@order/controllers/order/get";
import * as create from "@order/controllers/order/create";
import * as update from "@order/controllers/order/update";

const router = express.Router();

export function orderRoutes(): Router {
    router.get("/:orderId", get.byOrderId);
    router.get("/buyer/:buyerId", get.byBuyerId);
    router.get("/seller/:sellerId", get.bySellerId);

    router.post("/", create.order);
    router.post("/create-payment-intent", create.intent);

    router.put("/approve-order/:orderId", update.buyerApproveOrder);
    router.put("/cancel/:orderId", update.cancel);
    router.put("/gig/:type/:orderId", update.deliveryDate);
    router.put("/extension/:orderId", update.requestExtension);
    router.put("/deliver-order/:orderId", update.sellerDeliverOrder);

    return router;
}
