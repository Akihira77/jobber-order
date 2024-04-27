import {
    BadRequestError,
    IDeliveredWork,
    IExtendedDelivery,
    IOrderDocument,
    IOrderMessage,
    IReviewMessageDetails,
    lowerCase,
    NotFoundError,
    winstonLogger
} from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL, exchangeNamesAndRoutingKeys } from "@order/config";
import { OrderModel } from "@order/models/order.model";
import { publishDirectMessage } from "@order/queues/order.producer";
import { orderChannel } from "@order/server";
import { CLIENT_URL } from "@order/config";
import { sendNotification } from "@order/services/notification.service";
import { Logger } from "winston";
import { orderSchema } from "@order/schemas/order.schema";

const logger: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "orderService",
    "debug"
);

export async function getOrderByOrderId(
    orderId: string
): Promise<IOrderDocument | null> {
    try {
        const order = await OrderModel.findOne({ orderId }).lean().exec();

        if (!order) {
            throw new NotFoundError(
                "Order is not found",
                "getOrderByOrderId() method"
            );
        }

        return order;
    } catch (error) {
        if (error) {
            logger.error(
                "OrderService getOrderByOrderId() method error:",
                error
            );
            throw error;
        }
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function getOrdersBySellerId(
    sellerId: string
): Promise<IOrderDocument[]> {
    try {
        const order = await OrderModel.find({ sellerId }).lean().exec();

        return order;
    } catch (error) {
        logger.error("OrderService getOrdersBySellerId() method error:", error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function getOrdersByBuyerId(
    buyerId: string
): Promise<IOrderDocument[]> {
    try {
        const order = await OrderModel.find({ buyerId }).lean().exec();

        return order;
    } catch (error) {
        logger.error("OrderService getOrdersByBuyerId() method error:", error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function createOrder(
    data: IOrderDocument
): Promise<IOrderDocument> {
    try {
        const { error } = orderSchema.validate(data);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "createOrder() method"
            );
        }

        const orderData: IOrderDocument = await OrderModel.create(data);
        const messageDetails: IOrderMessage = {
            sellerId: data.sellerId,
            ongoingJobs: 1,
            type: "create-order"
        };
        const emailMessageDetails: IOrderMessage & {
            buyerEmail: string;
            sellerEmail: string;
        } = {
            orderId: data.orderId,
            invoiceId: data.invoiceId,
            orderDue: `${data.offer.newDeliveryDate}`,
            amount: `${data.price}`,
            buyerUsername: lowerCase(data.buyerUsername),
            buyerEmail: data.buyerEmail,
            sellerUsername: lowerCase(data.sellerUsername),
            sellerEmail: data.sellerEmail,
            title: data.offer.gigTitle,
            description: data.offer.description,
            requirements: data.requirements,
            serviceFee: `${orderData.serviceFee}`,
            total: `${orderData.price + orderData.serviceFee!}`,
            orderUrl: `${CLIENT_URL}/orders/${data.orderId}/activities`,
            template: "orderPlaced"
        };
        const { usersService, notificationService } =
            exchangeNamesAndRoutingKeys;

        await publishDirectMessage(
            orderChannel,
            usersService.seller.exchangeName,
            usersService.seller.routingKey,
            JSON.stringify(messageDetails),
            "Details sent to users service"
        );

        publishDirectMessage(
            orderChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(emailMessageDetails),
            "Order email sent to notification service"
        );

        sendNotification(
            orderData,
            data.sellerUsername,
            "placed an order for your gig."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error("OrderService createOrder() method error:", error);
            throw error;
        }
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function cancelOrder(
    orderId: string,
    data: IOrderMessage
): Promise<IOrderDocument> {
    try {
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    cancelled: true,
                    status: "Cancelled",
                    approvedAt: new Date()
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "cancelOrder() method"
            );
        }

        const { usersService } = exchangeNamesAndRoutingKeys;

        // update seller info
        await publishDirectMessage(
            orderChannel,
            usersService.seller.exchangeName,
            usersService.seller.routingKey,
            JSON.stringify({
                sellerId: data.sellerId,
                type: "cancel-order"
            }),
            "Cancelled order details sent to users service (Seller)"
        );

        // update buyer info
        await publishDirectMessage(
            orderChannel,
            usersService.buyer.exchangeName,
            usersService.buyer.routingKey,
            JSON.stringify({
                type: "cancel-order",
                buyerId: data.buyerId,
                purchasedGigs: data.purchasedGigs
            }),
            "Cancelled order details sent to users service (Buyer)"
        );

        sendNotification(
            orderData,
            orderData.sellerUsername,
            "cancelled your order delivery."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error("OrderService cancelOrder() method error:", error);
            throw error;
        }
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function approveOrder(
    orderId: string,
    data: IOrderMessage
): Promise<IOrderDocument> {
    try {
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    approved: true,
                    status: "Completed",
                    approvedAt: new Date()
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "approveOrder() method"
            );
        }

        const { usersService } = exchangeNamesAndRoutingKeys;
        const messageDetails: IOrderMessage = {
            sellerId: data.sellerId,
            buyerId: data.buyerId,
            ongoingJobs: data.ongoingJobs,
            completedJobs: data.completedJobs,
            totalEarnings: data.totalEarnings, // this is the price the seller earned for lastest order delivered
            recentDelivery: new Date()?.toString(),
            type: "approve-order"
        };

        // update seller info
        await publishDirectMessage(
            orderChannel,
            usersService.seller.exchangeName,
            usersService.seller.routingKey,
            JSON.stringify(messageDetails),
            "Approved order details sent to users service"
        );

        // update buyer info
        await publishDirectMessage(
            orderChannel,
            usersService.buyer.exchangeName,
            usersService.buyer.routingKey,
            JSON.stringify({
                type: "purchased-gigs",
                buyerId: data.buyerId,
                purchasedGigs: data.purchasedGigs
            }),
            "Approved order details sent to users service"
        );

        sendNotification(
            orderData,
            orderData.sellerUsername,
            "approved your order delivery."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error("OrderService approveOrder() method error:", error);
            throw error;
        }
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function deliverOrder(
    orderId: string,
    delivered: boolean,
    deliveredWork: IDeliveredWork
): Promise<IOrderDocument> {
    try {
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    delivered,
                    status: "Delivered",
                    ["events.orderDelivered"]: new Date()
                },
                $push: {
                    deliveredWork
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "deliverOrder() method"
            );
        }

        const { notificationService } = exchangeNamesAndRoutingKeys;
        const messageDetails: IOrderMessage = {
            orderId,
            buyerUsername: lowerCase(orderData.buyerUsername),
            receiverEmail: orderData.buyerEmail,
            sellerUsername: lowerCase(orderData.sellerUsername),
            title: orderData.offer.gigTitle,
            description: orderData.offer.description,
            orderUrl: `${CLIENT_URL}/orders/${orderId}/activities`,
            template: "orderDelivered"
        };

        // sent email
        publishDirectMessage(
            orderChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(messageDetails),
            "Order delivered message sent to notification service"
        );

        sendNotification(
            orderData,
            orderData.buyerUsername,
            "delivered your order."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error("OrderService deliverOrder() method error:", error);
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function requestDeliveryExtension(
    orderId: string,
    data: IExtendedDelivery
): Promise<IOrderDocument> {
    try {
        const { originalDate, newDate, days, reason } = data;
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    ["requestExtension.originalDate"]: originalDate,
                    ["requestExtension.newDate"]: newDate,
                    ["requestExtension.days"]: days,
                    ["requestExtension.reason"]: reason
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "requestDeliveryExtension() method"
            );
        }

        const { notificationService } = exchangeNamesAndRoutingKeys;
        const messageDetails: IOrderMessage = {
            buyerUsername: lowerCase(orderData.buyerUsername),
            receiverEmail: orderData.buyerEmail,
            sellerUsername: lowerCase(orderData.sellerUsername),
            originalDate: orderData.offer.oldDeliveryDate,
            newDate: orderData.offer.newDeliveryDate,
            reason: orderData.offer.reason,
            orderUrl: `${CLIENT_URL}/orders/${orderId}/activities`,
            template: "orderExtension"
        };

        // sent email
        publishDirectMessage(
            orderChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(messageDetails),
            "Order extension message sent to notification service"
        );

        sendNotification(
            orderData,
            orderData.buyerUsername,
            "requested for an order delivery date extension."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error(
                "OrderService requestDeliveryExtension() method error:",
                error
            );
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function approveExtensionDeliveryDate(
    orderId: string,
    data: IExtendedDelivery
): Promise<IOrderDocument> {
    try {
        const { deliveryDateUpdate, newDate, days, reason } = data;
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    ["offer.deliveryInDays"]: days,
                    ["offer.newDeliveryDate"]: newDate,
                    ["offer.reason"]: reason,
                    ["events.deliveryDateUpdate"]: new Date(
                        deliveryDateUpdate ?? ""
                    ),
                    requestExtension: {
                        originalDate: "",
                        newDate: "",
                        days: 0,
                        reason: ""
                    }
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "approveExtensionDeliveryDate() method"
            );
        }

        const { notificationService } = exchangeNamesAndRoutingKeys;
        const messageDetails: IOrderMessage = {
            subject: "Congratulations: Your extension request was approved",
            buyerUsername: lowerCase(orderData.buyerUsername),
            sellerUsername: lowerCase(orderData.sellerUsername),
            receiverEmail: orderData.sellerEmail,
            header: "Request Accepted",
            type: "accepted",
            message: "You can continue working on the order.",
            orderUrl: `${CLIENT_URL}/orders/${orderId}/activities`,
            template: "orderExtensionApproval"
        };

        // sent email
        publishDirectMessage(
            orderChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(messageDetails),
            "Order request extension approval message sent to notification service"
        );

        sendNotification(
            orderData,
            orderData.sellerUsername,
            "approved your order delivery date extension request."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error(
                "OrderService approveExtensionDeliveryDate() method error:",
                error
            );
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function rejectExtensionDeliveryDate(
    orderId: string
): Promise<IOrderDocument> {
    try {
        const orderData = await OrderModel.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    requestExtension: {
                        originalDate: "",
                        newDate: "",
                        days: 0,
                        reason: ""
                    }
                }
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "rejectExtensionDeliveryDate() method"
            );
        }

        const { notificationService } = exchangeNamesAndRoutingKeys;
        const messageDetails: IOrderMessage = {
            subject: "Sorry: Your extension request was rejected",
            buyerUsername: lowerCase(orderData.buyerUsername),
            receiverEmail: orderData.sellerEmail,
            sellerUsername: lowerCase(orderData.sellerUsername),
            header: "Request Rejected",
            type: "rejected",
            message: "You can contact the buyer for more information.",
            orderUrl: `${CLIENT_URL}/orders/${orderId}/activities`,
            template: "orderExtensionApproval"
        };

        // sent email
        publishDirectMessage(
            orderChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(messageDetails),
            "Order request extension rejection message sent to notification service"
        );

        sendNotification(
            orderData,
            orderData.sellerUsername,
            "rejected your order delivery date extension request."
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error(
                "OrderService rejectExtensionDeliveryDate() method error:",
                error
            );
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function updateOrderReview(
    data: IReviewMessageDetails
): Promise<IOrderDocument> {
    try {
        if (!["buyer-review", "seller-review"].includes(data.type)) {
            throw new BadRequestError(
                "You're neither buyer or seller. Can't access this resource.",
                "updateOrderReview() method"
            );
        }

        const orderData = await OrderModel.findOneAndUpdate(
            { orderId: data.orderId },
            {
                $set:
                    data.type === "buyer-review"
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
            },
            { new: true }
        ).exec();

        if (!orderData) {
            throw new NotFoundError(
                "Order is not found",
                "updateOrderReview() method"
            );
        }

        sendNotification(
            orderData,
            data.type === "buyer-review"
                ? orderData.sellerUsername
                : orderData.buyerUsername,
            `left you a ${data.rating} start review`
        );

        return orderData;
    } catch (error) {
        if (error) {
            logger.error(
                "OrderService updateOrderReview() method error:",
                error
            );
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again");
    }
}
