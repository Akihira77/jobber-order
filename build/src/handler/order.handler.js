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
const stripe_1 = __importDefault(require("stripe"));
const typia_1 = __importDefault(require("typia"));
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
            const generateRandomNumber = (length) => {
                return (Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
                    Math.pow(10, length - 1));
            };
            // the service charge is 5.5% of the purchased amount
            // for purchases under 50$, an additional $2 is applied
            const serviceFee = reqBody.price < 50
                ? (5.5 / 100) * reqBody.price + 2
                : (5.5 / 100) * reqBody.price;
            const orderData = Object.assign(Object.assign({}, reqBody), { orderId: `JO${generateRandomNumber(11)}`, invoiceId: `JI${generateRandomNumber(11)}`, serviceFee: serviceFee });
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
            // const { error, value } = orderUpdateSchema.validate(reqBody)
            const res = (input => {
                const errors = [];
                const __is = (input, _exceptionable = true) => {
                    const $io0 = (input, _exceptionable = true) => "string" === typeof input.originalDate && "string" === typeof input.newDate && "number" === typeof input.days && "string" === typeof input.reason && (undefined === input.deliveryDateUpdate || "string" === typeof input.deliveryDateUpdate) && (4 === Object.keys(input).length || Object.keys(input).every(key => {
                        if (["originalDate", "newDate", "days", "reason", "deliveryDateUpdate"].some(prop => key === prop))
                            return true;
                        const value = input[key];
                        if (undefined === value)
                            return true;
                        return false;
                    }));
                    return "object" === typeof input && null !== input && $io0(input, true);
                };
                if (false === __is(input)) {
                    const $report = typia_1.default.validateEquals.report(errors);
                    ((input, _path, _exceptionable = true) => {
                        const $join = typia_1.default.validateEquals.join;
                        const $vo0 = (input, _path, _exceptionable = true) => ["string" === typeof input.originalDate || $report(_exceptionable, {
                                path: _path + ".originalDate",
                                expected: "string",
                                value: input.originalDate
                            }), "string" === typeof input.newDate || $report(_exceptionable, {
                                path: _path + ".newDate",
                                expected: "string",
                                value: input.newDate
                            }), "number" === typeof input.days || $report(_exceptionable, {
                                path: _path + ".days",
                                expected: "number",
                                value: input.days
                            }), "string" === typeof input.reason || $report(_exceptionable, {
                                path: _path + ".reason",
                                expected: "string",
                                value: input.reason
                            }), undefined === input.deliveryDateUpdate || "string" === typeof input.deliveryDateUpdate || $report(_exceptionable, {
                                path: _path + ".deliveryDateUpdate",
                                expected: "(string | undefined)",
                                value: input.deliveryDateUpdate
                            }), 4 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                if (["originalDate", "newDate", "days", "reason", "deliveryDateUpdate"].some(prop => key === prop))
                                    return true;
                                const value = input[key];
                                if (undefined === value)
                                    return true;
                                return $report(_exceptionable, {
                                    path: _path + $join(key),
                                    expected: "undefined",
                                    value: value
                                });
                            }).every(flag => flag))].every(flag => flag);
                        return ("object" === typeof input && null !== input || $report(true, {
                            path: _path + "",
                            expected: "OrderUpdateSchema",
                            value: input
                        })) && $vo0(input, _path + "", true) || $report(true, {
                            path: _path + "",
                            expected: "OrderUpdateSchema",
                            value: input
                        });
                    })(input, "$input", true);
                }
                const success = 0 === errors.length;
                return {
                    success,
                    errors,
                    data: success ? input : undefined
                };
            })(reqBody);
            // if (error?.details) {
            //     throw new BadRequestError(
            //         error.details[0].message,
            //         "Update reqeustExtension() method"
            //     )
            // }
            if (!res.success) {
                throw new jobber_shared_1.BadRequestError(res.errors[0].expected, "Update reqeustExtension() method");
            }
            const order = yield this.orderService.requestDeliveryExtension(orderId, res.data);
            return order;
        });
    }
    updateDeliveryDate(orderId, type, reqBody) {
        return __awaiter(this, void 0, void 0, function* () {
            // const { error, value } = orderUpdateSchema.validate(reqBody)
            const res = (input => {
                const errors = [];
                const __is = (input, _exceptionable = true) => {
                    const $io0 = (input, _exceptionable = true) => "string" === typeof input.originalDate && "string" === typeof input.newDate && "number" === typeof input.days && "string" === typeof input.reason && (undefined === input.deliveryDateUpdate || "string" === typeof input.deliveryDateUpdate) && (4 === Object.keys(input).length || Object.keys(input).every(key => {
                        if (["originalDate", "newDate", "days", "reason", "deliveryDateUpdate"].some(prop => key === prop))
                            return true;
                        const value = input[key];
                        if (undefined === value)
                            return true;
                        return false;
                    }));
                    return "object" === typeof input && null !== input && $io0(input, true);
                };
                if (false === __is(input)) {
                    const $report = typia_1.default.validateEquals.report(errors);
                    ((input, _path, _exceptionable = true) => {
                        const $join = typia_1.default.validateEquals.join;
                        const $vo0 = (input, _path, _exceptionable = true) => ["string" === typeof input.originalDate || $report(_exceptionable, {
                                path: _path + ".originalDate",
                                expected: "string",
                                value: input.originalDate
                            }), "string" === typeof input.newDate || $report(_exceptionable, {
                                path: _path + ".newDate",
                                expected: "string",
                                value: input.newDate
                            }), "number" === typeof input.days || $report(_exceptionable, {
                                path: _path + ".days",
                                expected: "number",
                                value: input.days
                            }), "string" === typeof input.reason || $report(_exceptionable, {
                                path: _path + ".reason",
                                expected: "string",
                                value: input.reason
                            }), undefined === input.deliveryDateUpdate || "string" === typeof input.deliveryDateUpdate || $report(_exceptionable, {
                                path: _path + ".deliveryDateUpdate",
                                expected: "(string | undefined)",
                                value: input.deliveryDateUpdate
                            }), 4 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                if (["originalDate", "newDate", "days", "reason", "deliveryDateUpdate"].some(prop => key === prop))
                                    return true;
                                const value = input[key];
                                if (undefined === value)
                                    return true;
                                return $report(_exceptionable, {
                                    path: _path + $join(key),
                                    expected: "undefined",
                                    value: value
                                });
                            }).every(flag => flag))].every(flag => flag);
                        return ("object" === typeof input && null !== input || $report(true, {
                            path: _path + "",
                            expected: "OrderUpdateSchema",
                            value: input
                        })) && $vo0(input, _path + "", true) || $report(true, {
                            path: _path + "",
                            expected: "OrderUpdateSchema",
                            value: input
                        });
                    })(input, "$input", true);
                }
                const success = 0 === errors.length;
                return {
                    success,
                    errors,
                    data: success ? input : undefined
                };
            })(reqBody);
            // if (error?.details) {
            //     throw new BadRequestError(
            //         error.details[0].message,
            //         "Update reqeustExtension() method"
            //     )
            // }
            if (!res.success) {
                throw new jobber_shared_1.BadRequestError(res.errors[0].expected, "Update reqeustExtension() method");
            }
            const order = type === "approve"
                ? yield this.orderService.approveExtensionDeliveryDate(orderId, res.data)
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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