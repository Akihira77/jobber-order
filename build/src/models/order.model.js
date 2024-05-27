"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    offer: {
        gigTitle: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, required: true },
        deliveryInDays: { type: Number, required: true },
        oldDeliveryDate: { type: Date },
        newDeliveryDate: { type: Date },
        accepted: { type: Boolean, required: true },
        cancelled: { type: Boolean, required: true },
        reason: { type: String, default: "" }
    },
    gigId: { type: String, required: true },
    sellerId: { type: String, required: true, index: true },
    sellerUsername: { type: String, required: true },
    sellerImage: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    gigCoverImage: { type: String, required: true },
    gigMainTitle: { type: String, required: true },
    gigBasicTitle: { type: String, required: true },
    gigBasicDescription: { type: String, required: true },
    buyerId: { type: String, required: true, index: true },
    buyerUsername: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerImage: { type: String, required: true },
    status: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    invoiceId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    requirements: { type: String, default: "" },
    approved: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    approvedAt: { type: Date },
    paymentIntent: { type: String },
    deliveredWork: [
        {
            message: { type: String },
            file: { type: String },
            fileType: { type: String },
            fileSize: { type: String },
            fileName: { type: String }
        }
    ],
    requestExtension: {
        originalDate: { type: String, default: "" },
        newDate: { type: String, default: "" },
        days: { type: Number, default: 0 },
        reason: { type: String, default: "" }
    },
    dateOrdered: { type: Date, default: Date.now },
    events: {
        placeOrder: { type: Date },
        requirements: { type: Date },
        orderStarted: { type: Date },
        deliveryDateUpdate: { type: Date },
        orderDelivered: { type: Date },
        buyerReview: { type: Date },
        sellerReview: { type: Date }
    },
    buyerReview: {
        rating: { type: Number, default: 0 },
        review: { type: String, default: "" },
        created: { type: Date }
    }
}, {
    versionKey: false
});
const OrderModel = (0, mongoose_1.model)("Order", orderSchema, "Order");
exports.OrderModel = OrderModel;
//# sourceMappingURL=order.model.js.map