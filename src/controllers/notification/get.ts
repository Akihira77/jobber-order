import { getNotificationByUserToId } from "@order/services/notification.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function notifications(
    req: Request,
    res: Response
): Promise<void> {
    const notifications = await getNotificationByUserToId(
        req.params.userToName
    );

    res.status(StatusCodes.OK).json({
        message: "Notifications",
        notifications
    });
}
