"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderUpdateSchema = exports.orderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const orderSchema = joi_1.default.object().keys({
    offer: joi_1.default.object({
        gigTitle: joi_1.default.string().required(),
        price: joi_1.default.number().required(),
        description: joi_1.default.string().required(),
        deliveryInDays: joi_1.default.number().required(),
        oldDeliveryDate: joi_1.default.string().required(),
        newDeliveryDate: joi_1.default.string().optional(),
        accepted: joi_1.default.boolean().required(),
        cancelled: joi_1.default.boolean().required()
    }).required(),
    gigId: joi_1.default.string().required(),
    sellerId: joi_1.default.string().required(),
    sellerUsername: joi_1.default.string().required(),
    sellerEmail: joi_1.default.string().required(),
    sellerImage: joi_1.default.string().required(),
    gigCoverImage: joi_1.default.string().required(),
    gigMainTitle: joi_1.default.string().required(),
    gigBasicTitle: joi_1.default.string().required(),
    gigBasicDescription: joi_1.default.string().required(),
    buyerId: joi_1.default.string().required(),
    buyerUsername: joi_1.default.string().required(),
    buyerEmail: joi_1.default.string().required(),
    buyerImage: joi_1.default.string().required(),
    status: joi_1.default.string().required(),
    orderId: joi_1.default.string().required(),
    invoiceId: joi_1.default.string().required(),
    quantity: joi_1.default.number().required(),
    price: joi_1.default.number().required(),
    serviceFee: joi_1.default.number().optional(),
    requirements: joi_1.default.string().optional().allow(null, ""),
    paymentIntent: joi_1.default.string().required(),
    requestExtension: joi_1.default.object({
        originalDate: joi_1.default.string().required(),
        newDate: joi_1.default.string().required(),
        days: joi_1.default.number().required(),
        reason: joi_1.default.string().required()
    }).optional(),
    delivered: joi_1.default.boolean().optional(),
    approvedAt: joi_1.default.string().optional(),
    deliveredWork: joi_1.default.array()
        .items(joi_1.default.object({
        message: joi_1.default.string(),
        file: joi_1.default.string()
    }))
        .optional(),
    dateOrdered: joi_1.default.string().optional(),
    events: joi_1.default.object({
        placeOrder: joi_1.default.string(),
        requirements: joi_1.default.string(),
        orderStarted: joi_1.default.string(),
        deliverydateUpdate: joi_1.default.string().optional(),
        orderDelivered: joi_1.default.string().optional(),
        buyerReview: joi_1.default.string().optional(),
        sellerReview: joi_1.default.string().optional()
    }).optional(),
    buyerReview: joi_1.default.object({
        rating: joi_1.default.number(),
        review: joi_1.default.string()
    }).optional(),
    sellerReview: joi_1.default.object({
        rating: joi_1.default.number(),
        review: joi_1.default.string()
    }).optional()
});
exports.orderSchema = orderSchema;
const orderUpdateSchema = joi_1.default.object().keys({
    originalDate: joi_1.default.string().required(),
    newDate: joi_1.default.string().required(),
    days: joi_1.default.number().required(),
    reason: joi_1.default.string().required(),
    deliveryDateUpdate: joi_1.default.string().optional()
});
exports.orderUpdateSchema = orderUpdateSchema;
//# sourceMappingURL=order.schema.js.map