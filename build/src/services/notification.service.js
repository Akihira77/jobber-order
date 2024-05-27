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
exports.deleteOrderNotifications = exports.sendNotification = exports.markNotificationAsRead = exports.getNotificationByUserToId = exports.createNotification = void 0;
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../config");
const orderNotification_model_1 = require("../models/orderNotification.model");
const server_1 = require("../server");
const order_service_1 = require("../services/order.service");
const mongoose_1 = require("mongoose");
function createNotification(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notification = yield orderNotification_model_1.OrderNotificationModel.create(request);
            return notification;
        }
        catch (error) {
            console.log(error);
            throw new Error("Unexpected error occured. Please try again.");
        }
    });
}
exports.createNotification = createNotification;
function getNotificationByUserToId(userToId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notification = yield orderNotification_model_1.OrderNotificationModel.find({ userTo: userToId })
                .lean()
                .exec();
            return notification;
        }
        catch (error) {
            (0, config_1.logger)("services/notification.service.ts - getNotificationByUserToId()").error("OrderService getNotificationByUserToId() method error:", error);
            return [];
        }
    });
}
exports.getNotificationByUserToId = getNotificationByUserToId;
function markNotificationAsRead(notificationId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!(0, mongoose_1.isValidObjectId)(notificationId)) {
                return {};
            }
            const notification = yield orderNotification_model_1.OrderNotificationModel.findOneAndUpdate({
                _id: notificationId
            }, {
                $set: {
                    isRead: true
                }
            }, {
                new: true
            }).exec();
            if (!notification) {
                throw new jobber_shared_1.NotFoundError("OrderNotification is not found", "markNotificationAsRead() method");
            }
            const order = yield (0, order_service_1.getOrderByOrderId)(notification.orderId);
            server_1.socketIOOrderObject.emit("order_notification", order);
            return notification;
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
exports.markNotificationAsRead = markNotificationAsRead;
function sendNotification(request, userToId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notificationData = {
                userTo: userToId,
                senderUsername: request.sellerUsername,
                senderPicture: request.sellerImage,
                receiverUsername: request.buyerUsername,
                receiverPicture: request.buyerImage,
                message,
                orderId: request.orderId,
                createdAt: new Date()
            };
            const orderNotification = yield createNotification(notificationData);
            server_1.socketIOOrderObject.emit("order_notification", request, orderNotification);
        }
        catch (error) {
            console.log(error);
            throw new Error("Unexpected error occured. Please try again.");
        }
    });
}
exports.sendNotification = sendNotification;
function deleteOrderNotifications(userTo, senderUsername, orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield orderNotification_model_1.OrderNotificationModel.deleteMany({
                userTo,
                senderUsername,
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
exports.deleteOrderNotifications = deleteOrderNotifications;
//# sourceMappingURL=notification.service.js.map