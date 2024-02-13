import { markNotificationAsRead } from "@order/services/notification.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function notificationReadStatus(
    req: Request,
    res: Response
): Promise<void> {
    const notification = await markNotificationAsRead(req.body.notificationId);

    res.status(StatusCodes.OK).json({
        message: "Notification read status updated successfully.",
        notification
    });
}
