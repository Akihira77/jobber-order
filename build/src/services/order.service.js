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
exports.OrderService = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const order_model_1 = require("../models/order.model");
const typia_1 = __importDefault(require("typia"));
class OrderService {
    constructor(queue, pubCh, orderNotificationService) {
        this.queue = queue;
        this.pubCh = pubCh;
        this.orderNotificationService = orderNotificationService;
    }
    getOrderByOrderId(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield order_model_1.OrderModel.findOne({ orderId }).lean().exec();
                if (!order) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "getOrderByOrderId() method");
                }
                return order;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    getOrdersBySellerId(sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield order_model_1.OrderModel.find({ sellerId }).lean().exec();
                return order;
            }
            catch (error) {
                console.log(error);
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    getOrdersByBuyerId(buyerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield order_model_1.OrderModel.find({ buyerId }).lean().exec();
                return order;
            }
            catch (error) {
                console.log(error);
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    createOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = (input => {
                    const errors = [];
                    const __is = (input, _exceptionable = true) => {
                        const $io0 = (input, _exceptionable = true) => (undefined === input.orderId || "string" === typeof input.orderId) && (undefined === input.invoiceId || "string" === typeof input.invoiceId) && "string" === typeof input.gigId && "string" === typeof input.gigMainTitle && "string" === typeof input.gigBasicTitle && "string" === typeof input.gigBasicDescription && "string" === typeof input.gigCoverImage && "string" === typeof input.sellerId && "string" === typeof input.sellerUsername && "string" === typeof input.sellerEmail && "string" === typeof input.sellerImage && "string" === typeof input.buyerId && "string" === typeof input.buyerUsername && "string" === typeof input.buyerEmail && "string" === typeof input.buyerImage && "string" === typeof input.status && "number" === typeof input.quantity && "number" === typeof input.price && (undefined === input.serviceFee || "number" === typeof input.serviceFee) && (undefined === input.requirements || "string" === typeof input.requirements) && "string" === typeof input.paymentIntent && (undefined === input.requestExtension || "object" === typeof input.requestExtension && null !== input.requestExtension && $io1(input.requestExtension, true && _exceptionable)) && ("object" === typeof input.offer && null !== input.offer && $io2(input.offer, true && _exceptionable)) && (undefined === input.delivered || "boolean" === typeof input.delivered) && (undefined === input.approvedAt || "string" === typeof input.approvedAt) && (undefined === input.deliveredWork || Array.isArray(input.deliveredWork) && input.deliveredWork.every((elem, _index1) => "object" === typeof elem && null !== elem && $io3(elem, true && _exceptionable))) && "string" === typeof input.dateOrdered && (undefined === input.events || "object" === typeof input.events && null !== input.events && $io4(input.events, true && _exceptionable)) && (undefined === input.buyerReview || "object" === typeof input.buyerReview && null !== input.buyerReview && $io5(input.buyerReview, true && _exceptionable)) && (undefined === input.sellerReview || "object" === typeof input.sellerReview && null !== input.sellerReview && $io5(input.sellerReview, true && _exceptionable)) && (19 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["orderId", "invoiceId", "gigId", "gigMainTitle", "gigBasicTitle", "gigBasicDescription", "gigCoverImage", "sellerId", "sellerUsername", "sellerEmail", "sellerImage", "buyerId", "buyerUsername", "buyerEmail", "buyerImage", "status", "quantity", "price", "serviceFee", "requirements", "paymentIntent", "requestExtension", "offer", "delivered", "approvedAt", "deliveredWork", "dateOrdered", "events", "buyerReview", "sellerReview"].some(prop => key === prop))
                                return true;
                            const value = input[key];
                            if (undefined === value)
                                return true;
                            return false;
                        }));
                        const $io1 = (input, _exceptionable = true) => "string" === typeof input.originalDate && "string" === typeof input.newDate && "number" === typeof input.days && "string" === typeof input.reason && (4 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["originalDate", "newDate", "days", "reason"].some(prop => key === prop))
                                return true;
                            const value = input[key];
                            if (undefined === value)
                                return true;
                            return false;
                        }));
                        const $io2 = (input, _exceptionable = true) => "string" === typeof input.gigTitle && "number" === typeof input.price && "string" === typeof input.description && "number" === typeof input.deliveryInDays && "string" === typeof input.oldDeliveryDate && "string" === typeof input.newDeliveryDate && "boolean" === typeof input.accepted && "boolean" === typeof input.cancelled && (8 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["gigTitle", "price", "description", "deliveryInDays", "oldDeliveryDate", "newDeliveryDate", "accepted", "cancelled"].some(prop => key === prop))
                                return true;
                            const value = input[key];
                            if (undefined === value)
                                return true;
                            return false;
                        }));
                        const $io3 = (input, _exceptionable = true) => "string" === typeof input.message && "string" === typeof input.file && (2 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["message", "file"].some(prop => key === prop))
                                return true;
                            const value = input[key];
                            if (undefined === value)
                                return true;
                            return false;
                        }));
                        const $io4 = (input, _exceptionable = true) => "string" === typeof input.placeOrder && "string" === typeof input.requirements && "string" === typeof input.orderStarted && (undefined === input.deliverydateUpdate || "string" === typeof input.deliverydateUpdate) && (undefined === input.orderDelivered || "string" === typeof input.orderDelivered) && (undefined === input.buyerReview || "string" === typeof input.buyerReview) && (undefined === input.sellerReview || "string" === typeof input.sellerReview) && (3 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["placeOrder", "requirements", "orderStarted", "deliverydateUpdate", "orderDelivered", "buyerReview", "sellerReview"].some(prop => key === prop))
                                return true;
                            const value = input[key];
                            if (undefined === value)
                                return true;
                            return false;
                        }));
                        const $io5 = (input, _exceptionable = true) => "number" === typeof input.rating && "string" === typeof input.review && (2 === Object.keys(input).length || Object.keys(input).every(key => {
                            if (["rating", "review"].some(prop => key === prop))
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
                            const $vo0 = (input, _path, _exceptionable = true) => [undefined === input.orderId || "string" === typeof input.orderId || $report(_exceptionable, {
                                    path: _path + ".orderId",
                                    expected: "(string | undefined)",
                                    value: input.orderId
                                }), undefined === input.invoiceId || "string" === typeof input.invoiceId || $report(_exceptionable, {
                                    path: _path + ".invoiceId",
                                    expected: "(string | undefined)",
                                    value: input.invoiceId
                                }), "string" === typeof input.gigId || $report(_exceptionable, {
                                    path: _path + ".gigId",
                                    expected: "string",
                                    value: input.gigId
                                }), "string" === typeof input.gigMainTitle || $report(_exceptionable, {
                                    path: _path + ".gigMainTitle",
                                    expected: "string",
                                    value: input.gigMainTitle
                                }), "string" === typeof input.gigBasicTitle || $report(_exceptionable, {
                                    path: _path + ".gigBasicTitle",
                                    expected: "string",
                                    value: input.gigBasicTitle
                                }), "string" === typeof input.gigBasicDescription || $report(_exceptionable, {
                                    path: _path + ".gigBasicDescription",
                                    expected: "string",
                                    value: input.gigBasicDescription
                                }), "string" === typeof input.gigCoverImage || $report(_exceptionable, {
                                    path: _path + ".gigCoverImage",
                                    expected: "string",
                                    value: input.gigCoverImage
                                }), "string" === typeof input.sellerId || $report(_exceptionable, {
                                    path: _path + ".sellerId",
                                    expected: "string",
                                    value: input.sellerId
                                }), "string" === typeof input.sellerUsername || $report(_exceptionable, {
                                    path: _path + ".sellerUsername",
                                    expected: "string",
                                    value: input.sellerUsername
                                }), "string" === typeof input.sellerEmail || $report(_exceptionable, {
                                    path: _path + ".sellerEmail",
                                    expected: "string",
                                    value: input.sellerEmail
                                }), "string" === typeof input.sellerImage || $report(_exceptionable, {
                                    path: _path + ".sellerImage",
                                    expected: "string",
                                    value: input.sellerImage
                                }), "string" === typeof input.buyerId || $report(_exceptionable, {
                                    path: _path + ".buyerId",
                                    expected: "string",
                                    value: input.buyerId
                                }), "string" === typeof input.buyerUsername || $report(_exceptionable, {
                                    path: _path + ".buyerUsername",
                                    expected: "string",
                                    value: input.buyerUsername
                                }), "string" === typeof input.buyerEmail || $report(_exceptionable, {
                                    path: _path + ".buyerEmail",
                                    expected: "string",
                                    value: input.buyerEmail
                                }), "string" === typeof input.buyerImage || $report(_exceptionable, {
                                    path: _path + ".buyerImage",
                                    expected: "string",
                                    value: input.buyerImage
                                }), "string" === typeof input.status || $report(_exceptionable, {
                                    path: _path + ".status",
                                    expected: "string",
                                    value: input.status
                                }), "number" === typeof input.quantity || $report(_exceptionable, {
                                    path: _path + ".quantity",
                                    expected: "number",
                                    value: input.quantity
                                }), "number" === typeof input.price || $report(_exceptionable, {
                                    path: _path + ".price",
                                    expected: "number",
                                    value: input.price
                                }), undefined === input.serviceFee || "number" === typeof input.serviceFee || $report(_exceptionable, {
                                    path: _path + ".serviceFee",
                                    expected: "(number | undefined)",
                                    value: input.serviceFee
                                }), undefined === input.requirements || "string" === typeof input.requirements || $report(_exceptionable, {
                                    path: _path + ".requirements",
                                    expected: "(string | undefined)",
                                    value: input.requirements
                                }), "string" === typeof input.paymentIntent || $report(_exceptionable, {
                                    path: _path + ".paymentIntent",
                                    expected: "string",
                                    value: input.paymentIntent
                                }), undefined === input.requestExtension || ("object" === typeof input.requestExtension && null !== input.requestExtension || $report(_exceptionable, {
                                    path: _path + ".requestExtension",
                                    expected: "(RequestExtension | undefined)",
                                    value: input.requestExtension
                                })) && $vo1(input.requestExtension, _path + ".requestExtension", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".requestExtension",
                                    expected: "(RequestExtension | undefined)",
                                    value: input.requestExtension
                                }), ("object" === typeof input.offer && null !== input.offer || $report(_exceptionable, {
                                    path: _path + ".offer",
                                    expected: "Offer",
                                    value: input.offer
                                })) && $vo2(input.offer, _path + ".offer", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".offer",
                                    expected: "Offer",
                                    value: input.offer
                                }), undefined === input.delivered || "boolean" === typeof input.delivered || $report(_exceptionable, {
                                    path: _path + ".delivered",
                                    expected: "(boolean | undefined)",
                                    value: input.delivered
                                }), undefined === input.approvedAt || "string" === typeof input.approvedAt || $report(_exceptionable, {
                                    path: _path + ".approvedAt",
                                    expected: "(string | undefined)",
                                    value: input.approvedAt
                                }), undefined === input.deliveredWork || (Array.isArray(input.deliveredWork) || $report(_exceptionable, {
                                    path: _path + ".deliveredWork",
                                    expected: "(Array<DeliveredWork> | undefined)",
                                    value: input.deliveredWork
                                })) && input.deliveredWork.map((elem, _index1) => ("object" === typeof elem && null !== elem || $report(_exceptionable, {
                                    path: _path + ".deliveredWork[" + _index1 + "]",
                                    expected: "DeliveredWork",
                                    value: elem
                                })) && $vo3(elem, _path + ".deliveredWork[" + _index1 + "]", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".deliveredWork[" + _index1 + "]",
                                    expected: "DeliveredWork",
                                    value: elem
                                })).every(flag => flag) || $report(_exceptionable, {
                                    path: _path + ".deliveredWork",
                                    expected: "(Array<DeliveredWork> | undefined)",
                                    value: input.deliveredWork
                                }), "string" === typeof input.dateOrdered || $report(_exceptionable, {
                                    path: _path + ".dateOrdered",
                                    expected: "string",
                                    value: input.dateOrdered
                                }), undefined === input.events || ("object" === typeof input.events && null !== input.events || $report(_exceptionable, {
                                    path: _path + ".events",
                                    expected: "(Events | undefined)",
                                    value: input.events
                                })) && $vo4(input.events, _path + ".events", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".events",
                                    expected: "(Events | undefined)",
                                    value: input.events
                                }), undefined === input.buyerReview || ("object" === typeof input.buyerReview && null !== input.buyerReview || $report(_exceptionable, {
                                    path: _path + ".buyerReview",
                                    expected: "(BuyerOrSellerReview | undefined)",
                                    value: input.buyerReview
                                })) && $vo5(input.buyerReview, _path + ".buyerReview", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".buyerReview",
                                    expected: "(BuyerOrSellerReview | undefined)",
                                    value: input.buyerReview
                                }), undefined === input.sellerReview || ("object" === typeof input.sellerReview && null !== input.sellerReview || $report(_exceptionable, {
                                    path: _path + ".sellerReview",
                                    expected: "(BuyerOrSellerReview | undefined)",
                                    value: input.sellerReview
                                })) && $vo5(input.sellerReview, _path + ".sellerReview", true && _exceptionable) || $report(_exceptionable, {
                                    path: _path + ".sellerReview",
                                    expected: "(BuyerOrSellerReview | undefined)",
                                    value: input.sellerReview
                                }), 19 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["orderId", "invoiceId", "gigId", "gigMainTitle", "gigBasicTitle", "gigBasicDescription", "gigCoverImage", "sellerId", "sellerUsername", "sellerEmail", "sellerImage", "buyerId", "buyerUsername", "buyerEmail", "buyerImage", "status", "quantity", "price", "serviceFee", "requirements", "paymentIntent", "requestExtension", "offer", "delivered", "approvedAt", "deliveredWork", "dateOrdered", "events", "buyerReview", "sellerReview"].some(prop => key === prop))
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
                            const $vo1 = (input, _path, _exceptionable = true) => ["string" === typeof input.originalDate || $report(_exceptionable, {
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
                                }), 4 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["originalDate", "newDate", "days", "reason"].some(prop => key === prop))
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
                            const $vo2 = (input, _path, _exceptionable = true) => ["string" === typeof input.gigTitle || $report(_exceptionable, {
                                    path: _path + ".gigTitle",
                                    expected: "string",
                                    value: input.gigTitle
                                }), "number" === typeof input.price || $report(_exceptionable, {
                                    path: _path + ".price",
                                    expected: "number",
                                    value: input.price
                                }), "string" === typeof input.description || $report(_exceptionable, {
                                    path: _path + ".description",
                                    expected: "string",
                                    value: input.description
                                }), "number" === typeof input.deliveryInDays || $report(_exceptionable, {
                                    path: _path + ".deliveryInDays",
                                    expected: "number",
                                    value: input.deliveryInDays
                                }), "string" === typeof input.oldDeliveryDate || $report(_exceptionable, {
                                    path: _path + ".oldDeliveryDate",
                                    expected: "string",
                                    value: input.oldDeliveryDate
                                }), "string" === typeof input.newDeliveryDate || $report(_exceptionable, {
                                    path: _path + ".newDeliveryDate",
                                    expected: "string",
                                    value: input.newDeliveryDate
                                }), "boolean" === typeof input.accepted || $report(_exceptionable, {
                                    path: _path + ".accepted",
                                    expected: "boolean",
                                    value: input.accepted
                                }), "boolean" === typeof input.cancelled || $report(_exceptionable, {
                                    path: _path + ".cancelled",
                                    expected: "boolean",
                                    value: input.cancelled
                                }), 8 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["gigTitle", "price", "description", "deliveryInDays", "oldDeliveryDate", "newDeliveryDate", "accepted", "cancelled"].some(prop => key === prop))
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
                            const $vo3 = (input, _path, _exceptionable = true) => ["string" === typeof input.message || $report(_exceptionable, {
                                    path: _path + ".message",
                                    expected: "string",
                                    value: input.message
                                }), "string" === typeof input.file || $report(_exceptionable, {
                                    path: _path + ".file",
                                    expected: "string",
                                    value: input.file
                                }), 2 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["message", "file"].some(prop => key === prop))
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
                            const $vo4 = (input, _path, _exceptionable = true) => ["string" === typeof input.placeOrder || $report(_exceptionable, {
                                    path: _path + ".placeOrder",
                                    expected: "string",
                                    value: input.placeOrder
                                }), "string" === typeof input.requirements || $report(_exceptionable, {
                                    path: _path + ".requirements",
                                    expected: "string",
                                    value: input.requirements
                                }), "string" === typeof input.orderStarted || $report(_exceptionable, {
                                    path: _path + ".orderStarted",
                                    expected: "string",
                                    value: input.orderStarted
                                }), undefined === input.deliverydateUpdate || "string" === typeof input.deliverydateUpdate || $report(_exceptionable, {
                                    path: _path + ".deliverydateUpdate",
                                    expected: "(string | undefined)",
                                    value: input.deliverydateUpdate
                                }), undefined === input.orderDelivered || "string" === typeof input.orderDelivered || $report(_exceptionable, {
                                    path: _path + ".orderDelivered",
                                    expected: "(string | undefined)",
                                    value: input.orderDelivered
                                }), undefined === input.buyerReview || "string" === typeof input.buyerReview || $report(_exceptionable, {
                                    path: _path + ".buyerReview",
                                    expected: "(string | undefined)",
                                    value: input.buyerReview
                                }), undefined === input.sellerReview || "string" === typeof input.sellerReview || $report(_exceptionable, {
                                    path: _path + ".sellerReview",
                                    expected: "(string | undefined)",
                                    value: input.sellerReview
                                }), 3 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["placeOrder", "requirements", "orderStarted", "deliverydateUpdate", "orderDelivered", "buyerReview", "sellerReview"].some(prop => key === prop))
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
                            const $vo5 = (input, _path, _exceptionable = true) => ["number" === typeof input.rating || $report(_exceptionable, {
                                    path: _path + ".rating",
                                    expected: "number",
                                    value: input.rating
                                }), "string" === typeof input.review || $report(_exceptionable, {
                                    path: _path + ".review",
                                    expected: "string",
                                    value: input.review
                                }), 2 === Object.keys(input).length || (false === _exceptionable || Object.keys(input).map(key => {
                                    if (["rating", "review"].some(prop => key === prop))
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
                                expected: "OrderSchema",
                                value: input
                            })) && $vo0(input, _path + "", true) || $report(true, {
                                path: _path + "",
                                expected: "OrderSchema",
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
                })(data);
                if (!res.success) {
                    throw new jobber_shared_1.BadRequestError(res.errors[0].expected, "createOrder() method");
                }
                const orderData = yield order_model_1.OrderModel.create(data);
                // const emailMessageDetails: IOrderMessage & {
                //     sellerEmail: string
                //     buyerEmail: string
                // } = {
                //     orderId: data.orderId,
                //     invoiceId: data.invoiceId,
                //     orderDue: `${data.offer.newDeliveryDate}`,
                //     amount: `${data.price}`,
                //     buyerUsername: lowerCase(data.buyerUsername),
                //     buyerEmail: data.buyerEmail,
                //     sellerEmail: data.sellerEmail,
                //     sellerUsername: lowerCase(data.sellerUsername),
                //     title: data.offer.gigTitle,
                //     description: data.offer.description,
                //     requirements: data.requirements,
                //     serviceFee: `${orderData.serviceFee}`,
                //     total: `${orderData.price + orderData.serviceFee!}`,
                //     orderUrl: `${CLIENT_URL}/orders/${data.orderId}/activities`,
                //     template: "orderPlaced"
                // }
                const { usersService } = config_1.exchangeNamesAndRoutingKeys;
                this.queue.publishDirectMessage(this.pubCh, usersService.seller.exchangeName, usersService.seller.routingKey, (input => {
                    const $string = typia_1.default.json.stringify.string;
                    return `{"sellerId":${$string(input.sellerId)},"ongoingJobs":${input.ongoingJobs},"type":${$string(input.type)}}`;
                })({
                    sellerId: data.sellerId,
                    ongoingJobs: 1,
                    type: "create-order"
                }), "Details sent to users service");
                // this.queue.publishDirectMessage(
                //     notificationService.order.exchangeName,
                //     notificationService.order.routingKey,
                //     JSON.stringify(emailMessageDetails),
                //     "Order email sent to notification service"
                // )
                this.orderNotificationService.sendNotification(orderData, data.sellerUsername, "placed an order for your gig.");
                return orderData;
            }
            catch (error) {
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    cancelOrder(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        cancelled: true,
                        status: "Cancelled",
                        approvedAt: new Date()
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "cancelOrder() method");
                }
                const { usersService } = config_1.exchangeNamesAndRoutingKeys;
                // update seller info
                this.queue.publishDirectMessage(this.pubCh, usersService.seller.exchangeName, usersService.seller.routingKey, JSON.stringify({
                    sellerId: data.sellerId,
                    type: "cancel-order"
                }), "Cancelled order details sent to users service");
                // update buyer info
                this.queue.publishDirectMessage(this.pubCh, usersService.buyer.exchangeName, usersService.buyer.routingKey, JSON.stringify({
                    type: "cancel-order",
                    buyerId: data.buyerId,
                    purchasedGigs: data.purchasedGigs
                }), "Cancelled order details sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.sellerUsername, "cancelled your order delivery.");
                return orderData;
            }
            catch (error) {
                if (error instanceof jobber_shared_1.CustomError) {
                    console.log(error);
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    approveOrder(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        approved: true,
                        status: "Completed",
                        approvedAt: new Date()
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "approveOrder() method");
                }
                const { usersService } = config_1.exchangeNamesAndRoutingKeys;
                const messageDetails = {
                    sellerId: data.sellerId,
                    buyerId: data.buyerId,
                    ongoingJobs: data.ongoingJobs,
                    completedJobs: data.completedJobs,
                    totalEarnings: data.totalEarnings, // this is the price the seller earned for lastest order delivered
                    recentDelivery: (_a = new Date()) === null || _a === void 0 ? void 0 : _a.toString(),
                    type: "approve-order"
                };
                // update seller info
                this.queue.publishDirectMessage(this.pubCh, usersService.seller.exchangeName, usersService.seller.routingKey, JSON.stringify(messageDetails), "Approved order details sent to users service");
                // update buyer info
                this.queue.publishDirectMessage(this.pubCh, usersService.buyer.exchangeName, usersService.buyer.routingKey, JSON.stringify({
                    type: "purchased-gigs",
                    buyerId: data.buyerId,
                    purchasedGigs: data.purchasedGigs
                }), "Approved order details sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.sellerUsername, "approved your order delivery.");
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    deliverOrder(orderId, delivered, deliveredWork) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        delivered,
                        status: "Delivered",
                        ["events.orderDelivered"]: new Date()
                    },
                    $push: {
                        deliveredWork
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "deliverOrder() method");
                }
                const { notificationService } = config_1.exchangeNamesAndRoutingKeys;
                const messageDetails = {
                    orderId,
                    buyerUsername: (0, jobber_shared_1.lowerCase)(orderData.buyerUsername),
                    receiverEmail: orderData.buyerEmail,
                    sellerUsername: (0, jobber_shared_1.lowerCase)(orderData.sellerUsername),
                    title: orderData.offer.gigTitle,
                    description: orderData.offer.description,
                    orderUrl: `${config_1.CLIENT_URL}/orders/${orderId}/activities`,
                    template: "orderDelivered"
                };
                // sent email
                this.queue.publishDirectMessage(this.pubCh, notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order delivered message sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.buyerUsername, "delivered your order.");
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    requestDeliveryExtension(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { originalDate, newDate, days, reason } = data;
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        ["requestExtension.originalDate"]: originalDate,
                        ["requestExtension.newDate"]: newDate,
                        ["requestExtension.days"]: days,
                        ["requestExtension.reason"]: reason
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "requestDeliveryExtension() method");
                }
                const { notificationService } = config_1.exchangeNamesAndRoutingKeys;
                const messageDetails = {
                    buyerUsername: (0, jobber_shared_1.lowerCase)(orderData.buyerUsername),
                    receiverEmail: orderData.buyerEmail,
                    sellerUsername: (0, jobber_shared_1.lowerCase)(orderData.sellerUsername),
                    originalDate: orderData.offer.oldDeliveryDate,
                    newDate: orderData.offer.newDeliveryDate,
                    reason: orderData.offer.reason,
                    orderUrl: `${config_1.CLIENT_URL}/orders/${orderId}/activities`,
                    template: "orderExtension"
                };
                // sent email
                this.queue.publishDirectMessage(this.pubCh, notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order extension message sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.buyerUsername, "requested for an order delivery date extension.");
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    approveExtensionDeliveryDate(orderId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { deliveryDateUpdate, newDate, days, reason } = data;
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        ["offer.deliveryInDays"]: days,
                        ["offer.newDeliveryDate"]: newDate,
                        ["offer.reason"]: reason,
                        ["events.deliveryDateUpdate"]: new Date(deliveryDateUpdate !== null && deliveryDateUpdate !== void 0 ? deliveryDateUpdate : ""),
                        requestExtension: {
                            originalDate: "",
                            newDate: "",
                            days: 0,
                            reason: ""
                        }
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "approveExtensionDeliveryDate() method");
                }
                const { notificationService } = config_1.exchangeNamesAndRoutingKeys;
                const messageDetails = {
                    subject: "Congratulations: Your extension request was approved",
                    buyerUsername: (0, jobber_shared_1.lowerCase)(orderData.buyerUsername),
                    sellerUsername: (0, jobber_shared_1.lowerCase)(orderData.sellerUsername),
                    receiverEmail: orderData.sellerEmail,
                    header: "Request Accepted",
                    type: "accepted",
                    message: "You can continue working on the order.",
                    orderUrl: `${config_1.CLIENT_URL}/orders/${orderId}/activities`,
                    template: "orderExtensionApproval"
                };
                // sent email
                this.queue.publishDirectMessage(this.pubCh, notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order request extension approval message sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.sellerUsername, "approved your order delivery date extension request.");
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    rejectExtensionDeliveryDate(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId }, {
                    $set: {
                        requestExtension: {
                            originalDate: "",
                            newDate: "",
                            days: 0,
                            reason: ""
                        }
                    }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "rejectExtensionDeliveryDate() method");
                }
                const { notificationService } = config_1.exchangeNamesAndRoutingKeys;
                const messageDetails = {
                    subject: "Sorry: Your extension request was rejected",
                    buyerUsername: (0, jobber_shared_1.lowerCase)(orderData.buyerUsername),
                    receiverEmail: orderData.sellerEmail,
                    sellerUsername: (0, jobber_shared_1.lowerCase)(orderData.sellerUsername),
                    header: "Request Rejected",
                    type: "rejected",
                    message: "You can contact the buyer for more information.",
                    orderUrl: `${config_1.CLIENT_URL}/orders/${orderId}/activities`,
                    template: "orderExtensionApproval"
                };
                // sent email
                this.queue.publishDirectMessage(this.pubCh, notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order request extension rejection message sent to notification service");
                this.orderNotificationService.sendNotification(orderData, orderData.sellerUsername, "rejected your order delivery date extension request.");
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
    updateOrderReview(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!["buyer-review", "seller-review"].includes(data.type)) {
                    throw new jobber_shared_1.BadRequestError("You're neither buyer or seller. Can't access this resource.", "updateOrderReview() method");
                }
                const orderData = yield order_model_1.OrderModel.findOneAndUpdate({ orderId: data.orderId }, {
                    $set: data.type === "buyer-review"
                        ? {
                            buyerReview: {
                                rating: data.rating,
                                review: data.review,
                                created: data.createdAt
                                    ? new Date(data.createdAt)
                                    : new Date()
                            },
                            events: {
                                buyerReview: data.createdAt
                                    ? new Date(data.createdAt)
                                    : new Date()
                            }
                        }
                        : {
                            sellerReview: {
                                rating: data.rating,
                                review: data.review,
                                created: data.createdAt
                                    ? new Date(data.createdAt)
                                    : new Date()
                            },
                            events: {
                                sellerReview: data.createdAt
                                    ? new Date(data.createdAt)
                                    : new Date()
                            }
                        }
                }, { new: true }).exec();
                if (!orderData) {
                    throw new jobber_shared_1.NotFoundError("Order is not found", "updateOrderReview() method");
                }
                this.orderNotificationService.sendNotification(orderData, data.type === "buyer-review"
                    ? orderData.sellerUsername
                    : orderData.buyerUsername, `left you a ${data.rating} start review`);
                return orderData;
            }
            catch (error) {
                console.log(error);
                if (error instanceof jobber_shared_1.CustomError) {
                    throw error;
                }
                throw new Error("Unexpected error occured. Please try again");
            }
        });
    }
    deleteOrder(gigId, sellerId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield order_model_1.OrderModel.deleteOne({
                    gigId,
                    sellerId,
                    orderId
                }).exec();
                return result.deletedCount > 0;
            }
            catch (error) {
                console.log(error);
                throw new Error("Unexpected error occured. Please try again.");
            }
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map