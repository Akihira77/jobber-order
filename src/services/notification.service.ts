import { IOrderDocument, IOrderNotifcation } from "@Akihira77/jobber-shared";
import { OrderNotificationModel } from "@order/models/notification.model";
import { socketIOOrderObject } from "@order/server";
import { getOrderByOrderId } from "@order/services/order.service";

export async function createNotification(
    request: IOrderNotifcation
): Promise<IOrderNotifcation> {
    const notification = await OrderNotificationModel.create(request);

    return notification;
}

export async function getNotificationByUserToId(
    userToId: string
): Promise<IOrderNotifcation[]> {
    const notification: IOrderNotifcation[] = await OrderNotificationModel.find(
        { userTo: userToId }
    )
        .lean()
        .exec();

    return notification;
}

export async function markNotificationAsRead(
    notificationId: string
): Promise<IOrderNotifcation> {
    const notification = (await OrderNotificationModel.findOneAndUpdate(
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
    ).exec()) as IOrderNotifcation;

    const order: IOrderDocument = await getOrderByOrderId(notification.orderId);

    socketIOOrderObject.emit("order_notification", order);

    return notification;
}

export async function sendNotification(
    request: IOrderDocument,
    userToId: string,
    message: string
): Promise<void> {
    const notificationData = {
        userTo: userToId,
        senderUsername: request.sellerUsername,
        senderPicture: request.sellerImage,
        receiverUsername: request.buyerUsername,
        receiverPicture: request.buyerImage,
        message,
        orderId: request.orderId
    } as IOrderNotifcation;

    const orderNotification = await createNotification(notificationData);

    socketIOOrderObject.emit("order_notification", request, orderNotification);
}
