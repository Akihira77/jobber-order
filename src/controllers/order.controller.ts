import crypto from "crypto";

import {
    BadRequestError,
    IOrderDocument,
    uploads,
    IDeliveredWork
} from "@Akihira77/jobber-shared";
import { STRIPE_API_PRIVATE_KEY } from "@order/config";
import { orderSchema, orderUpdateSchema } from "@order/schemas/order.schema";
import * as notificationService from "@order/services/notification.service";
import * as orderService from "@order/services/order.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_API_PRIVATE_KEY!, {
    typescript: true
});

export async function findNotificationsByUserTo(
    req: Request,
    res: Response
): Promise<void> {
    const notifications = await notificationService.getNotificationByUserToId(
        req.params.userToName
    );

    res.status(StatusCodes.OK).json({
        message: "Notifications",
        notifications
    });
}

export async function updateNotificationReadStatus(
    req: Request,
    res: Response
): Promise<void> {
    const notification = await notificationService.markNotificationAsRead(
        req.body.notificationId
    );

    res.status(StatusCodes.OK).json({
        message: "Notification read status updated successfully.",
        notification
    });
}

export async function createOrderIntent(
    req: Request,
    res: Response
): Promise<void> {
    const customer: Stripe.Response<Stripe.ApiSearchResult<Stripe.Customer>> =
        await stripe.customers.search({
            query: `email:"${req.currentUser!.email}"`
        });
    let customerId: string = customer.data[0]?.id;

    if (customer.data.length === 0) {
        const createdCustomer: Stripe.Response<Stripe.Customer> =
            await stripe.customers.create({
                email: req.currentUser!.email,
                metadata: {
                    buyerId: req.body.buyerId
                }
            });
        customerId = createdCustomer.id;
    }

    let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

    if (customerId) {
        // the service charge is 5.5% of the purchased amount
        // for purchases under 50$, an additional $2 is applied
        const serviceFee: number =
            req.body.price < 50
                ? (5.5 / 100) * req.body.price + 2
                : (5.5 / 100) * req.body.price;
        paymentIntent = await stripe.paymentIntents.create({
            amount: Math.floor((req.body.price + serviceFee) * 100),
            currency: "usd",
            customer: customerId,
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.status(StatusCodes.CREATED).json({
            message: "Order intent created successfully.",
            clientSecret: paymentIntent.client_secret!,
            paymentIntentId: paymentIntent.id
        });
        return;
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Unexpected error occured. Please try again"
    });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
    const { error } = orderSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Create order() method"
        );
    }

    // the service charge is 5.5% of the purchased amount
    // for purchases under 50$, an additional $2 is applied
    const serviceFee: number =
        req.body.price < 50
            ? (5.5 / 100) * req.body.price + 2
            : (5.5 / 100) * req.body.price;
    const orderData: IOrderDocument = {
        ...req.body,
        serviceFee: serviceFee
    };
    const order: IOrderDocument = await orderService.createOrder(orderData);

    res.status(StatusCodes.CREATED).json({
        message: "Order created successfully.",
        order
    });
}

export async function getOrderbyOrderId(
    req: Request,
    res: Response
): Promise<void> {
    const order = await orderService.getOrderByOrderId(req.params.orderId);

    res.status(StatusCodes.OK).json({ message: "Order by orderId", order });
}

export async function getOrdersbySellerId(
    req: Request,
    res: Response
): Promise<void> {
    const orders = await orderService.getOrdersBySellerId(req.params.sellerId);

    res.status(StatusCodes.OK).json({ message: "Seller orders", orders });
}

export async function getOrdersbyBuyerId(
    req: Request,
    res: Response
): Promise<void> {
    const orders = await orderService.getOrdersByBuyerId(req.params.buyerId);

    res.status(StatusCodes.OK).json({ message: "Buyer orders", orders });
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
    await stripe.refunds.create({
        payment_intent: `${req.body.paymentIntentId}`
    });

    const { orderId } = req.params;

    await orderService.cancelOrder(orderId, req.body.orderData);

    res.status(StatusCodes.OK).json({
        message: "Order cancelled successfully."
    });
}

export async function sellerRequestExtension(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = orderUpdateSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Update reqeustExtension() method"
        );
    }

    const { orderId } = req.params;

    const order: IOrderDocument = await orderService.requestDeliveryExtension(
        orderId,
        req.body
    );

    res.status(StatusCodes.OK).json({
        message: "Order delivery request",
        order
    });
}

export async function updateDeliveryDate(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = orderUpdateSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Update deliveryDate() method"
        );
    }

    const { orderId, type } = req.params;

    const order: IOrderDocument =
        type === "approve"
            ? await orderService.approveExtensionDeliveryDate(orderId, req.body)
            : await orderService.rejectExtensionDeliveryDate(orderId);

    res.status(StatusCodes.OK).json({
        message: "Order delivery date extension",
        order
    });
}

export async function buyerApproveOrder(
    req: Request,
    res: Response
): Promise<void> {
    const { orderId } = req.params;

    const order: IOrderDocument = await orderService.approveOrder(
        orderId,
        req.body
    );

    res.status(StatusCodes.OK).json({
        message: "Order approve successfully.",
        order
    });
}

export async function sellerDeliverOrder(
    req: Request,
    res: Response
): Promise<void> {
    const { orderId } = req.params;
    let file: string = req.body.file;
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");

    if (file) {
        if (parseInt(req.body.fileSize) > 10485760) {
            throw new BadRequestError(
                "File is too large. Maximum is 10Mb",
                "Update deliverOrder() method"
            );
        }

        const result =
            req.body.fileType === "zip"
                ? await uploads(file, `${randomCharacters}.zip`)
                : await uploads(file);

        if (!result?.public_id) {
            throw new BadRequestError(
                result?.message ?? "File upload error. Try again",
                "Update deliverOrder() method"
            );
        }

        file = result?.secure_url;
    }

    const deliveredWork: IDeliveredWork = {
        message: req.body.message,
        file,
        fileType: req.body.fileType,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize
    };

    const order: IOrderDocument = await orderService.deliverOrder(
        orderId,
        true,
        deliveredWork
    );

    res.status(StatusCodes.OK).json({
        message: "Order delivered successfully.",
        order
    });
}
