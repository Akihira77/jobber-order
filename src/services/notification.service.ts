import {
    CustomError,
    IOrderDocument,
    IOrderNotifcation,
    NotFoundError
} from "@Akihira77/jobber-shared";
import { logger } from "@order/config";
import { OrderNotificationModel } from "@order/models/notification.model";
import { socketIOOrderObject } from "@order/server";
import { getOrderByOrderId } from "@order/services/order.service";
import { isValidObjectId } from "mongoose";

export async function createNotification(
    request: IOrderNotifcation
): Promise<IOrderNotifcation> {
    try {
        const notification = await OrderNotificationModel.create(request);

        return notification;
    } catch (error) {
        console.log(error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function getNotificationByUserToId(
    userToId: string
): Promise<IOrderNotifcation[]> {
    try {
        const notification: IOrderNotifcation[] =
            await OrderNotificationModel.find({ userTo: userToId })
                .lean()
                .exec();

        return notification;
    } catch (error) {
        logger("services/notification.service.ts - getNotificationByUserToId()").error(
            "OrderService getNotificationByUserToId() method error:",
            error
        );
        return [];
    }
}

export async function markNotificationAsRead(
    notificationId: string
): Promise<IOrderNotifcation> {
    try {
        if (!isValidObjectId(notificationId)) {
            return {} as IOrderNotifcation;
        }

        const notification = await OrderNotificationModel.findOneAndUpdate(
            {
                _id: notificationId
            },
            {
                $set: {
                    isRead: true
                }
            },
            {
                new: true
            }
        ).exec();

        if (!notification) {
            throw new NotFoundError(
                "OrderNotification is not found",
                "markNotificationAsRead() method"
            );
        }

        const order: IOrderDocument | null = await getOrderByOrderId(
            notification.orderId
        );

        socketIOOrderObject.emit("order_notification", order);
        return notification;
    } catch (error) {
        console.log(error);
        if (error instanceof CustomError) {
            throw error;
        }

        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function sendNotification(
    request: IOrderDocument,
    userToId: string,
    message: string
): Promise<void> {
    try {
        const notificationData: IOrderNotifcation = {
            userTo: userToId,
            senderUsername: request.sellerUsername,
            senderPicture: request.sellerImage,
            receiverUsername: request.buyerUsername,
            receiverPicture: request.buyerImage,
            message,
            orderId: request.orderId,
            createdAt: new Date()
        };

        const orderNotification = await createNotification(notificationData);

        socketIOOrderObject.emit(
            "order_notification",
            request,
            orderNotification
        );
    } catch (error) {
        console.log(error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}

export async function deleteOrderNotifications(
    userTo: string,
    senderUsername: string,
    orderId: string
): Promise<boolean> {
    try {
        const result = await OrderNotificationModel.deleteMany({
            userTo,
            senderUsername,
            orderId
        }).exec();

        return result.deletedCount > 0;
    } catch (error) {
        console.log(error);
        throw new Error("Unexpected error occured. Please try again.");
    }
}
