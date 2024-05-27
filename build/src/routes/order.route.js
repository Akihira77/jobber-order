"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const orderController = __importStar(require("../controllers/order.controller"));
const router = express_1.default.Router();
function orderRoutes() {
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
exports.orderRoutes = orderRoutes;
//# sourceMappingURL=order.route.js.map