import j, { ObjectSchema } from "joi";

const orderSchema: ObjectSchema = j.object().keys({
    offer: j
        .object({
            gigTitle: j.string().required(),
            price: j.number().required(),
            description: j.string().required(),
            deliveryInDays: j.number().required(),
            oldDeliveryDate: j.string().required(),
            newDeliveryDate: j.string().optional(),
            accepted: j.boolean().required(),
            cancelled: j.boolean().required()
        })
        .required(),
    gigId: j.string().required(),
    sellerId: j.string().required(),
    sellerUsername: j.string().required(),
    sellerEmail: j.string().required(),
    sellerImage: j.string().required(),
    gigCoverImage: j.string().required(),
    gigMainTitle: j.string().required(),
    gigBasicTitle: j.string().required(),
    gigBasicDescription: j.string().required(),
    buyerId: j.string().required(),
    buyerUsername: j.string().required(),
    buyerEmail: j.string().required(),
    buyerImage: j.string().required(),
    status: j.string().required(),
    orderId: j.string().required(),
    invoiceId: j.string().required(),
    quantity: j.number().required(),
    price: j.number().required(),
    serviceFee: j.number().optional(),
    requirements: j.string().optional().allow(null, ""),
    paymentIntent: j.string().required(),
    requestExtension: j
        .object({
            originalDate: j.string().required(),
            newDate: j.string().required(),
            days: j.number().required(),
            reason: j.string().required()
        })
        .optional(),
    delivered: j.boolean().optional(),
    approvedAt: j.string().optional(),
    deliveredWork: j
        .array()
        .items(
            j.object({
                message: j.string(),
                file: j.string()
            })
        )
        .optional(),
    dateOrdered: j.string().optional(),
    events: j
        .object({
            placeOrder: j.string(),
            requirements: j.string(),
            orderStarted: j.string(),
            deliverydateUpdate: j.string().optional(),
            orderDelivered: j.string().optional(),
            buyerReview: j.string().optional(),
            sellerReview: j.string().optional()
        })
        .optional(),
    buyerReview: j
        .object({
            rating: j.number(),
            review: j.string()
        })
        .optional(),
    sellerReview: j
        .object({
            rating: j.number(),
            review: j.string()
        })
        .optional()
});

const orderUpdateSchema: ObjectSchema = j.object().keys({
    originalDate: j.string().required(),
    newDate: j.string().required(),
    days: j.number().required(),
    reason: j.string().required(),
    deliveryDateUpdate: j.string().optional()
});

export { orderSchema, orderUpdateSchema };
