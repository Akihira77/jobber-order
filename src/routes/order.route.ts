import express, { Router } from "express";
import * as orderController from "@order/controllers/order.controller";

const router = express.Router();

export function orderRoutes(): Router {
    router.get("/:orderId", orderController.getOrderbyOrderId);
    router.get("/buyer/:buyerId", orderController.getOrdersbyBuyerId);
    router.get("/seller/:sellerId", orderController.getOrdersbySellerId);

    router.post("/", orderController.createOrder);
    router.post("/create-payment-intent", orderController.createOrderIntent);

    router.put("/approve-order/:orderId", orderController.buyerApproveOrder);
    router.put("/cancel/:orderId", orderController.cancelOrder);
    router.put("/gig/:type/:orderId", orderController.updateDeliveryDate);
    router.put("/extension/:orderId", orderController.sellerRequestExtension);
    router.put("/deliver-order/:orderId", orderController.sellerDeliverOrder);

    return router;
}
