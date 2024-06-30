"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderNotificationModel = void 0;
const mongoose_1 = require("mongoose");
const orderNotificationSchema = new mongoose_1.Schema({
    userTo: { type: String, default: "", index: true },
    senderUsername: { type: String, default: "" },
    senderPicture: { type: String, default: "" },
    receiverUsername: { type: String, default: "" },
    receiverPicture: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    message: { type: String, default: "" },
    orderId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});
const OrderNotificationModel = (0, mongoose_1.model)("OrderNotification", orderNotificationSchema, "OrderNotification");
exports.OrderNotificationModel = OrderNotificationModel;
//# sourceMappingURL=orderNotification.model.js.map