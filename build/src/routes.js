"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = void 0;
const http_status_codes_1 = require("http-status-codes");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const orderNotification_service_1 = require("./services/orderNotification.service");
const order_service_1 = require("./services/order.service");
const order_handler_1 = require("./handler/order.handler");
const config_1 = require("./config");
// const BASE_PATH = "/api/v1/order";
const BASE_PATH = "/order";
function appRoutes(app, queue, logger) {
    app.get("/order-health", (c) => {
        return c.text("Order service is healthy and OK.", http_status_codes_1.StatusCodes.OK);
    });
    const notificationSvc = new orderNotification_service_1.OrderNotificationService(logger);
    const orderSvc = new order_service_1.OrderService(queue, notificationSvc);
    const orderHndlr = new order_handler_1.OrderHandler(orderSvc, notificationSvc);
    const api = app.basePath(BASE_PATH);
    // api.use(verifyGatewayRequest, authOnly)
    api.use(authOnly);
    orderRoute(api, orderHndlr);
    orderNotifRoute(api, orderHndlr);
    api.use(verifyGatewayRequest);
}
exports.appRoutes = appRoutes;
function orderRoute(api, orderHndlr) {
    api.get("/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const orderId = c.req.param("orderId");
        const order = yield orderHndlr.getOrderbyOrderId.bind(orderHndlr)(orderId);
        return c.json({ message: "Order by orderId", order }, http_status_codes_1.StatusCodes.OK);
    }));
    api.get("/buyer/:buyerId", (c) => __awaiter(this, void 0, void 0, function* () {
        const buyerId = c.req.param("buyerId");
        const orders = yield orderHndlr.getOrdersbyBuyerId.bind(orderHndlr)(buyerId);
        return c.json({ message: "Buyer orders", orders }, http_status_codes_1.StatusCodes.OK);
    }));
    api.get("/seller/:sellerId", (c) => __awaiter(this, void 0, void 0, function* () {
        const sellerId = c.req.param("sellerId");
        const orders = yield orderHndlr.getOrdersbySellerId.bind(orderHndlr)(sellerId);
        return c.json({ message: "Seller orders", orders }, http_status_codes_1.StatusCodes.OK);
    }));
    api.post("/", (c) => __awaiter(this, void 0, void 0, function* () {
        const jsonBody = yield c.req.json();
        const order = yield orderHndlr.createOrder.bind(orderHndlr)(jsonBody);
        return c.json({
            message: "Order created successfully.",
            order
        }, http_status_codes_1.StatusCodes.CREATED);
    }));
    api.post("/create-payment-intent", (c) => __awaiter(this, void 0, void 0, function* () {
        const jsonBody = yield c.req.json();
        const paymentIntent = yield orderHndlr.createOrderIntent.bind(orderHndlr)(c.get("currentUser"), jsonBody);
        return c.json({
            message: "Order intent created successfully.",
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        }, http_status_codes_1.StatusCodes.CREATED);
    }));
    api.put("/approve-order/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const orderId = c.req.param("orderId");
        const jsonBody = yield c.req.json();
        const order = yield orderHndlr.buyerApproveOrder.bind(orderHndlr)(orderId, jsonBody);
        return c.json({
            message: "Order approve successfully.",
            order
        }, http_status_codes_1.StatusCodes.OK);
    }));
    api.put("/cancel/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const orderId = c.req.param("orderId");
        const jsonBody = yield c.req.json();
        const result = yield orderHndlr.cancelOrder.bind(orderHndlr)(orderId, jsonBody);
        return c.json({
            message: `Order cancelled ${result ? "successfully" : "failed"}.`
        }, http_status_codes_1.StatusCodes.OK);
    }));
    api.put("/gig/:type/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const { type, orderId } = c.req.param();
        const jsonBody = yield c.req.json();
        const order = yield orderHndlr.updateDeliveryDate.bind(orderHndlr)(orderId, type, jsonBody);
        return c.json({
            message: "Order delivery date extension",
            order
        }, http_status_codes_1.StatusCodes.OK);
    }));
    api.put("/extension/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const orderId = c.req.param("orderId");
        const jsonBody = yield c.req.json();
        const order = yield orderHndlr.sellerRequestExtension.bind(orderHndlr)(orderId, jsonBody);
        return c.json({
            message: "Order delivery request",
            order
        }, http_status_codes_1.StatusCodes.OK);
    }));
    api.put("/deliver-order/:orderId", (c) => __awaiter(this, void 0, void 0, function* () {
        const orderId = c.req.param("orderId");
        const jsonBody = yield c.req.json();
        const order = yield orderHndlr.sellerDeliverOrder.bind(orderHndlr)(orderId, jsonBody);
        return c.json({
            message: "Order delivered successfully.",
            order
        }, http_status_codes_1.StatusCodes.OK);
    }));
}
function orderNotifRoute(api, orderHndlr) {
    api.get("/notifications/:userToName", (c) => __awaiter(this, void 0, void 0, function* () {
        const userToName = c.req.param("userToName");
        const orderNotifs = yield orderHndlr.findNotificationsByUserTo.bind(orderHndlr)(userToName);
        return c.json({
            message: "Notifications",
            notifications: orderNotifs
        }, http_status_codes_1.StatusCodes.OK);
    }));
    api.put("/notification/mark-as-read", (c) => __awaiter(this, void 0, void 0, function* () {
        const { notificationId } = yield c.req.json();
        const orderNotif = yield orderHndlr.updateNotificationReadStatus.bind(orderHndlr)(notificationId);
        return c.json({
            message: "Notification read status updated successfully.",
            notification: orderNotif
        }, http_status_codes_1.StatusCodes.OK);
    }));
}
function verifyGatewayRequest(c, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = c.req.header("gatewayToken");
        if (!token) {
            throw new jobber_shared_1.NotAuthorizedError("Invalid request", "verifyGatewayRequest() method: Request not coming from api gateway");
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.GATEWAY_JWT_TOKEN);
            c.set("gatewayToken", payload);
            yield next();
        }
        catch (error) {
            c.text("User cannot access the resource.", http_status_codes_1.StatusCodes.FORBIDDEN);
            return;
        }
    });
}
function authOnly(c, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const currUser = c.get("currentUser");
        if (currUser && Object.keys(currUser).length > 0) {
            return yield next();
        }
        throw new jobber_shared_1.NotAuthorizedError("User is not authenticated. Please signin first.", "routes.ts - authOnly() method");
    });
}
//# sourceMappingURL=routes.js.map