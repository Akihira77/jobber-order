import {
    getOrderByOrderId,
    getOrdersByBuyerId,
    getOrdersBySellerId
} from "@order/services/order.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function byOrderId(req: Request, res: Response): Promise<void> {
    const order = await getOrderByOrderId(req.params.orderId);

    res.status(StatusCodes.OK).json({ message: "Order by orderId", order });
}

export async function bySellerId(req: Request, res: Response): Promise<void> {
    const orders = await getOrdersBySellerId(req.params.sellerId);

    res.status(StatusCodes.OK).json({ message: "Seller orders", orders });
}

export async function byBuyerId(req: Request, res: Response): Promise<void> {
    const orders = await getOrdersByBuyerId(req.params.buyerId);

    res.status(StatusCodes.OK).json({ message: "Buyer orders", orders });
}
