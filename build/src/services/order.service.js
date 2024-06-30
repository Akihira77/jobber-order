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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const order_model_1 = require("../models/order.model");
const order_schema_1 = require("../schemas/order.schema");
class OrderService {
    constructor(queue, orderNotificationService) {
        this.queue = queue;
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
                const { error } = order_schema_1.orderSchema.validate(data);
                if (error === null || error === void 0 ? void 0 : error.details) {
                    throw new jobber_shared_1.BadRequestError(error.details[0].message, "createOrder() method");
                }
                const orderData = yield order_model_1.OrderModel.create(data);
                const messageDetails = {
                    sellerId: data.sellerId,
                    ongoingJobs: 1,
                    type: "create-order"
                };
                const emailMessageDetails = {
                    orderId: data.orderId,
                    invoiceId: data.invoiceId,
                    orderDue: `${data.offer.newDeliveryDate}`,
                    amount: `${data.price}`,
                    buyerUsername: (0, jobber_shared_1.lowerCase)(data.buyerUsername),
                    buyerEmail: data.buyerEmail,
                    sellerEmail: data.sellerEmail,
                    sellerUsername: (0, jobber_shared_1.lowerCase)(data.sellerUsername),
                    title: data.offer.gigTitle,
                    description: data.offer.description,
                    requirements: data.requirements,
                    serviceFee: `${orderData.serviceFee}`,
                    total: `${orderData.price + orderData.serviceFee}`,
                    orderUrl: `${config_1.CLIENT_URL}/orders/${data.orderId}/activities`,
                    template: "orderPlaced"
                };
                const { usersService, notificationService } = config_1.exchangeNamesAndRoutingKeys;
                this.queue.publishDirectMessage(usersService.seller.exchangeName, usersService.seller.routingKey, JSON.stringify(messageDetails), "Details sent to users service");
                this.queue.publishDirectMessage(notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(emailMessageDetails), "Order email sent to notification service");
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
                this.queue.publishDirectMessage(usersService.seller.exchangeName, usersService.seller.routingKey, JSON.stringify({
                    sellerId: data.sellerId,
                    type: "cancel-order"
                }), "Cancelled order details sent to users service");
                // update buyer info
                this.queue.publishDirectMessage(usersService.buyer.exchangeName, usersService.buyer.routingKey, JSON.stringify({
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
                this.queue.publishDirectMessage(usersService.seller.exchangeName, usersService.seller.routingKey, JSON.stringify(messageDetails), "Approved order details sent to users service");
                // update buyer info
                this.queue.publishDirectMessage(usersService.buyer.exchangeName, usersService.buyer.routingKey, JSON.stringify({
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
                this.queue.publishDirectMessage(notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order delivered message sent to notification service");
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
                this.queue.publishDirectMessage(notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order extension message sent to notification service");
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
                this.queue.publishDirectMessage(notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order request extension approval message sent to notification service");
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
                this.queue.publishDirectMessage(notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(messageDetails), "Order request extension rejection message sent to notification service");
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