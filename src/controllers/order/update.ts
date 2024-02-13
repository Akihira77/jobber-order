import crypto from "crypto";
import {
    BadRequestError,
    IDeliveredWork,
    IOrderDocument,
    uploads
} from "@Akihira77/jobber-shared";
import { STRIPE_API_PRIVATE_KEY } from "@order/config";
import { orderUpdateSchema } from "@order/schemas/order.schema";
import {
    approveExtensionDeliveryDate,
    approveOrder,
    cancelOrder,
    deliverOrder,
    rejectExtensionDeliveryDate,
    requestDeliveryExtension
} from "@order/services/order.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

const stripe: Stripe = new Stripe(STRIPE_API_PRIVATE_KEY!, {
    typescript: true
});

export async function cancel(req: Request, res: Response): Promise<void> {
    await stripe.refunds.create({
        payment_intent: `${req.body.paymentIntentId}`
    });

    const { orderId } = req.params;

    await cancelOrder(orderId, req.body.orderData);

    res.status(StatusCodes.OK).json({
        message: "Order cancelled successfully."
    });
}

export async function requestExtension(
    req: Request,
    res: Response
): Promise<void> {
    const { error } = await Promise.resolve(
        orderUpdateSchema.validate(req.body)
    );

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Update reqeustExtension() method"
        );
    }

    const { orderId } = req.params;

    const order: IOrderDocument = await requestDeliveryExtension(
        orderId,
        req.body
    );

    res.status(StatusCodes.OK).json({
        message: "Order delivery request",
        order
    });
}

export async function deliveryDate(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(
        orderUpdateSchema.validate(req.body)
    );

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Update deliveryDate() method"
        );
    }

    const { orderId, type } = req.params;

    const order: IOrderDocument =
        type === "approve"
            ? await approveExtensionDeliveryDate(orderId, req.body)
            : await rejectExtensionDeliveryDate(orderId);

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

    const order: IOrderDocument = await approveOrder(orderId, req.body);

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
        const result =
            req.body.fileType === "zip"
                ? await uploads(file, `${randomCharacters}.zip`)
                : await uploads(file);

        if (!result?.public_id) {
            throw new BadRequestError(
                "File uplaod error. Try again",
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

    const order: IOrderDocument = await deliverOrder(
        orderId,
        true,
        deliveredWork
    );

    res.status(StatusCodes.OK).json({
        message: "Order delivered successfully.",
        order
    });
}
