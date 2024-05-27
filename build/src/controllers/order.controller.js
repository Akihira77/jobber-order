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
exports.sellerDeliverOrder = exports.buyerApproveOrder = exports.updateDeliveryDate = exports.sellerRequestExtension = exports.cancelOrder = exports.getOrdersbyBuyerId = exports.getOrdersbySellerId = exports.getOrderbyOrderId = exports.createOrder = exports.createOrderIntent = exports.updateNotificationReadStatus = exports.findNotificationsByUserTo = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const order_schema_1 = require("../schemas/order.schema");
const notificationService = __importStar(require("../services/notification.service"));
const orderService = __importStar(require("../services/order.service"));
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(config_1.STRIPE_API_PRIVATE_KEY, {
    typescript: true
});
function findNotificationsByUserTo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const notifications = yield notificationService.getNotificationByUserToId(req.params.userToName);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Notifications",
            notifications
        });
    });
}
exports.findNotificationsByUserTo = findNotificationsByUserTo;
function updateNotificationReadStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const notification = yield notificationService.markNotificationAsRead(req.body.notificationId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Notification read status updated successfully.",
            notification
        });
    });
}
exports.updateNotificationReadStatus = updateNotificationReadStatus;
function createOrderIntent(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const customer = yield stripe.customers.search({
            query: `email:"${req.currentUser.email}"`
        });
        let customerId = (_a = customer.data[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (customer.data.length === 0) {
            const createdCustomer = yield stripe.customers.create({
                email: req.currentUser.email,
                metadata: {
                    buyerId: req.body.buyerId
                }
            });
            customerId = createdCustomer.id;
        }
        let paymentIntent;
        if (customerId) {
            // the service charge is 5.5% of the purchased amount
            // for purchases under 50$, an additional $2 is applied
            const serviceFee = req.body.price < 50
                ? (5.5 / 100) * req.body.price + 2
                : (5.5 / 100) * req.body.price;
            paymentIntent = yield stripe.paymentIntents.create({
                amount: Math.floor((req.body.price + serviceFee) * 100),
                currency: "usd",
                customer: customerId,
                automatic_payment_methods: {
                    enabled: true
                }
            });
            res.status(http_status_codes_1.StatusCodes.CREATED).json({
                message: "Order intent created successfully.",
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
            return;
        }
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Unexpected error occured. Please try again"
        });
    });
}
exports.createOrderIntent = createOrderIntent;
function createOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = order_schema_1.orderSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Create order() method");
        }
        // the service charge is 5.5% of the purchased amount
        // for purchases under 50$, an additional $2 is applied
        const serviceFee = req.body.price < 50
            ? (5.5 / 100) * req.body.price + 2
            : (5.5 / 100) * req.body.price;
        const orderData = Object.assign(Object.assign({}, req.body), { serviceFee: serviceFee });
        const order = yield orderService.createOrder(orderData);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Order created successfully.",
            order
        });
    });
}
exports.createOrder = createOrder;
function getOrderbyOrderId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const order = yield orderService.getOrderByOrderId(req.params.orderId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Order by orderId", order });
    });
}
exports.getOrderbyOrderId = getOrderbyOrderId;
function getOrdersbySellerId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const orders = yield orderService.getOrdersBySellerId(req.params.sellerId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Seller orders", orders });
    });
}
exports.getOrdersbySellerId = getOrdersbySellerId;
function getOrdersbyBuyerId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const orders = yield orderService.getOrdersByBuyerId(req.params.buyerId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Buyer orders", orders });
    });
}
exports.getOrdersbyBuyerId = getOrdersbyBuyerId;
function cancelOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield stripe.refunds.create({
            payment_intent: `${req.body.paymentIntentId}`
        });
        const { orderId } = req.params;
        yield orderService.cancelOrder(orderId, req.body.orderData);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Order cancelled successfully."
        });
    });
}
exports.cancelOrder = cancelOrder;
function sellerRequestExtension(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = order_schema_1.orderUpdateSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Update reqeustExtension() method");
        }
        const { orderId } = req.params;
        const order = yield orderService.requestDeliveryExtension(orderId, req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Order delivery request",
            order
        });
    });
}
exports.sellerRequestExtension = sellerRequestExtension;
function updateDeliveryDate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = order_schema_1.orderUpdateSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Update deliveryDate() method");
        }
        const { orderId, type } = req.params;
        const order = type === "approve"
            ? yield orderService.approveExtensionDeliveryDate(orderId, req.body)
            : yield orderService.rejectExtensionDeliveryDate(orderId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Order delivery date extension",
            order
        });
    });
}
exports.updateDeliveryDate = updateDeliveryDate;
function buyerApproveOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { orderId } = req.params;
        const order = yield orderService.approveOrder(orderId, req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Order approve successfully.",
            order
        });
    });
}
exports.buyerApproveOrder = buyerApproveOrder;
function sellerDeliverOrder(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { orderId } = req.params;
        let file = req.body.file;
        const randomBytes = yield Promise.resolve(crypto_1.default.randomBytes(20));
        const randomCharacters = randomBytes.toString("hex");
        if (file) {
            if (parseInt(req.body.fileSize) > 10485760) {
                throw new jobber_shared_1.BadRequestError("File is too large. Maximum is 10Mb", "Update deliverOrder() method");
            }
            const result = req.body.fileType === "zip"
                ? yield (0, jobber_shared_1.uploads)(file, `${randomCharacters}.zip`)
                : yield (0, jobber_shared_1.uploads)(file);
            if (!(result === null || result === void 0 ? void 0 : result.public_id)) {
                throw new jobber_shared_1.BadRequestError((_a = result === null || result === void 0 ? void 0 : result.message) !== null && _a !== void 0 ? _a : "File upload error. Try again", "Update deliverOrder() method");
            }
            file = result === null || result === void 0 ? void 0 : result.secure_url;
        }
        const deliveredWork = {
            message: req.body.message,
            file,
            fileType: req.body.fileType,
            fileName: req.body.fileName,
            fileSize: req.body.fileSize
        };
        const order = yield orderService.deliverOrder(orderId, true, deliveredWork);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Order delivered successfully.",
            order
        });
    });
}
exports.sellerDeliverOrder = sellerDeliverOrder;
//# sourceMappingURL=order.controller.js.map