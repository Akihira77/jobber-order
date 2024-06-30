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
exports.OrderHandler = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const order_schema_1 = require("../schemas/order.schema");
const stripe_1 = __importDefault(require("stripe"));
class OrderHandler {
    constructor(orderService, orderNotificationService) {
        this.orderService = orderService;
        this.orderNotificationService = orderNotificationService;
        this.stripe = new stripe_1.default(config_1.STRIPE_API_PRIVATE_KEY, {
            typescript: true
        });
    }
    findNotificationsByUserTo(userToName) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderNotifs = yield this.orderNotificationService.getNotificationByUserToId(userToName);
            return orderNotifs;
        });
    }
    updateNotificationReadStatus(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderNotif = yield this.orderNotificationService.markNotificationAsRead(notificationId);
            return orderNotif;
        });
    }
    createOrderIntent(currUser, reqBody) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const customer = yield this.stripe.customers.search({
                query: `email:"${currUser.email}"`
            });
            let customerId = (_a = customer.data[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (customer.data.length === 0) {
                const createdCustomer = yield this.stripe.customers.create({
                    email: currUser.email,
                    metadata: {
                        buyerId: reqBody.buyerId
                    }
                });
                customerId = createdCustomer.id;
            }
            let paymentIntent;
            if (customerId) {
                // the service charge is 5.5% of the purchased amount
                // for purchases under 50$, an additional $2 is applied
                const serviceFee = reqBody.price < 50
                    ? (5.5 / 100) * reqBody.price + 2
                    : (5.5 / 100) * reqBody.price;
                paymentIntent = yield this.stripe.paymentIntents.create({
                    amount: Math.floor((reqBody.price + serviceFee) * 100),
                    currency: "usd",
                    customer: customerId,
                    automatic_payment_methods: {
                        enabled: true
                    }
                });
                return paymentIntent;
            }
            throw new jobber_shared_1.BadRequestError("creating payment intent failed. Please try again.", "handler/order.handler.ts - createOrderIntent()");
        });
    }
    createOrder(reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, value } = order_schema_1.orderSchema.validate(reqBody);
            if (error === null || error === void 0 ? void 0 : error.details) {
                throw new jobber_shared_1.BadRequestError(error.details[0].message, "Create order() method");
            }
            const generateRandomNumber = (length) => {
                return (Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
                    Math.pow(10, length - 1));
            };
            // the service charge is 5.5% of the purchased amount
            // for purchases under 50$, an additional $2 is applied
            const serviceFee = value.price < 50
                ? (5.5 / 100) * value.price + 2
                : (5.5 / 100) * value.price;
            const orderData = Object.assign(Object.assign({}, value), { orderId: `JO${generateRandomNumber(11)}`, invoiceId: `JI${generateRandomNumber(11)}`, serviceFee: serviceFee });
            const order = yield this.orderService.createOrder(orderData);
            return order;
        });
    }
    getOrderbyOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderService.getOrderByOrderId(orderId);
            return order;
        });
    }
    getOrdersbySellerId(sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderService.getOrdersBySellerId(sellerId);
            return orders;
        });
    }
    getOrdersbyBuyerId(buyerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderService.getOrdersByBuyerId(buyerId);
            return orders;
        });
    }
    cancelOrder(orderId, reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stripe.refunds.create({
                payment_intent: `${reqBody.paymentIntentId}`
            });
            const order = yield this.orderService.cancelOrder(orderId, reqBody.orderData);
            return order !== null;
        });
    }
    sellerRequestExtension(orderId, reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, value } = order_schema_1.orderUpdateSchema.validate(reqBody);
            if (error === null || error === void 0 ? void 0 : error.details) {
                throw new jobber_shared_1.BadRequestError(error.details[0].message, "Update reqeustExtension() method");
            }
            const order = yield this.orderService.requestDeliveryExtension(orderId, value);
            return order;
        });
    }
    updateDeliveryDate(orderId, type, reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, value } = order_schema_1.orderUpdateSchema.validate(reqBody);
            if (error === null || error === void 0 ? void 0 : error.details) {
                throw new jobber_shared_1.BadRequestError(error.details[0].message, "Update deliveryDate() method");
            }
            const order = type === "approve"
                ? yield this.orderService.approveExtensionDeliveryDate(orderId, value)
                : yield this.orderService.rejectExtensionDeliveryDate(orderId);
            return order;
        });
    }
    buyerApproveOrder(orderId, reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderService.approveOrder(orderId, reqBody);
            return order;
        });
    }
    sellerDeliverOrder(orderId, reqBody) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let file = reqBody.file;
            const randomBytes = yield Promise.resolve(crypto_1.default.randomBytes(20));
            const randomCharacters = randomBytes.toString("hex");
            if (file) {
                if (parseInt(reqBody.fileSize) > 10485760) {
                    throw new jobber_shared_1.BadRequestError("File is too large. Maximum is 10Mb", "Update deliverOrder() method");
                }
                const result = reqBody.fileType === "zip"
                    ? yield (0, jobber_shared_1.uploads)(file, `${randomCharacters}.zip`)
                    : yield (0, jobber_shared_1.uploads)(file);
                if (!(result === null || result === void 0 ? void 0 : result.public_id)) {
                    throw new jobber_shared_1.BadRequestError((_a = result === null || result === void 0 ? void 0 : result.message) !== null && _a !== void 0 ? _a : "File upload error. Try again", "Update deliverOrder() method");
                }
                file = result === null || result === void 0 ? void 0 : result.secure_url;
            }
            const deliveredWork = {
                message: reqBody.message,
                file,
                fileType: reqBody.fileType,
                fileName: reqBody.fileName,
                fileSize: reqBody.fileSize
            };
            const order = yield this.orderService.deliverOrder(orderId, true, deliveredWork);
            return order;
        });
    }
}
exports.OrderHandler = OrderHandler;
//# sourceMappingURL=order.handler.js.map