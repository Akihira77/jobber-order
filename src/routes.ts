import { Logger } from "winston";
import { Context, Hono, Next } from "hono";
import { StatusCodes } from "http-status-codes";
import { NotAuthorizedError } from "@Akihira77/jobber-shared";
import jwt from "jsonwebtoken";

import { OrderNotificationService } from "./services/orderNotification.service";
import { OrderService } from "./services/order.service";
import { OrderQueue } from "./queues/order.queue";
import { OrderHandler } from "./handler/order.handler";
import { GATEWAY_JWT_TOKEN } from "./config";

const BASE_PATH = "/api/v1/order";

export function appRoutes(
    app: Hono,
    queue: OrderQueue,
    logger: (moduleName: string) => Logger
): void {
    app.get("/order-health", (c: Context) => {
        return c.text("Order service is healthy and OK.", StatusCodes.OK);
    });

    const notificationSvc = new OrderNotificationService(logger);
    const orderSvc = new OrderService(queue, notificationSvc);
    const orderHndlr = new OrderHandler(orderSvc, notificationSvc);

    const api = app.basePath(BASE_PATH);

    api.use(verifyGatewayRequest);
    orderRoute(api, orderHndlr);
    orderNotifRoute(api, orderHndlr);
}

function orderRoute(
    api: Hono<Record<string, never>, Record<string, never>, typeof BASE_PATH>,
    orderHndlr: OrderHandler
): void {
    api.get("/:orderId", async (c: Context) => {
        const orderId = c.req.param("orderId");
        const order =
            await orderHndlr.getOrderbyOrderId.bind(orderHndlr)(orderId);

        return c.json({ message: "Order by orderId", order }, StatusCodes.OK);
    });

    api.get("/buyer/:buyerId", async (c: Context) => {
        const buyerId = c.req.param("buyerId");
        const orders =
            await orderHndlr.getOrdersbyBuyerId.bind(orderHndlr)(buyerId);

        return c.json({ message: "Buyer orders", orders }, StatusCodes.OK);
    });
    api.get("/seller/:sellerId", async (c: Context) => {
        const sellerId = c.req.param("sellerId");
        const orders =
            await orderHndlr.getOrdersbySellerId.bind(orderHndlr)(sellerId);

        return c.json({ message: "Seller orders", orders }, StatusCodes.OK);
    });

    api.post("/", async (c: Context) => {
        const jsonBody = await c.req.json();
        const order = await orderHndlr.createOrder.bind(orderHndlr)(jsonBody);

        return c.json(
            {
                message: "Order created successfully.",
                order
            },
            StatusCodes.CREATED
        );
    });

    api.post("/create-payment-intent", async (c: Context) => {
        const jsonBody = await c.req.json();
        const paymentIntent = await orderHndlr.createOrderIntent.bind(
            orderHndlr
        )(c.get("currentUser"), jsonBody);

        return c.json(
            {
                message: "Order intent created successfully.",
                clientSecret: paymentIntent.client_secret!,
                paymentIntentId: paymentIntent.id
            },
            StatusCodes.CREATED
        );
    });

    api.put("/approve-order/:orderId", async (c: Context) => {
        const orderId = c.req.param("orderId");
        const jsonBody = await c.req.json();
        const order = await orderHndlr.buyerApproveOrder.bind(orderHndlr)(
            orderId,
            jsonBody
        );

        return c.json(
            {
                message: "Order approve successfully.",
                order
            },
            StatusCodes.OK
        );
    });

    api.put("/cancel/:orderId", async (c: Context) => {
        const orderId = c.req.param("orderId");
        const jsonBody = await c.req.json();
        const result = await orderHndlr.cancelOrder.bind(orderHndlr)(
            orderId,
            jsonBody
        );

        return c.json(
            {
                message: `Order cancelled ${result ? "successfully" : "failed"}.`
            },
            StatusCodes.OK
        );
    });

    api.put("/gig/:type/:orderId", async (c: Context) => {
        const { type, orderId } = c.req.param();
        const jsonBody = await c.req.json();
        const order = await orderHndlr.updateDeliveryDate.bind(orderHndlr)(
            orderId,
            type,
            jsonBody
        );

        return c.json(
            {
                message: "Order delivery date extension",
                order
            },
            StatusCodes.OK
        );
    });

    api.put("/extension/:orderId", async (c: Context) => {
        const orderId = c.req.param("orderId");
        const jsonBody = await c.req.json();
        const order = await orderHndlr.sellerRequestExtension.bind(orderHndlr)(
            orderId,
            jsonBody
        );

        return c.json(
            {
                message: "Order delivery request",
                order
            },
            StatusCodes.OK
        );
    });

    api.put("/deliver-order/:orderId", async (c: Context) => {
        const orderId = c.req.param("orderId");
        const jsonBody = await c.req.json();
        const order = await orderHndlr.sellerDeliverOrder.bind(orderHndlr)(
            orderId,
            jsonBody
        );

        return c.json(
            {
                message: "Order delivered successfully.",
                order
            },
            StatusCodes.OK
        );
    });
}

function orderNotifRoute(
    api: Hono<Record<string, never>, Record<string, never>, typeof BASE_PATH>,
    orderHndlr: OrderHandler
): void {
    api.get("/notifications/:userToName", async (c: Context) => {
        const userToName = c.req.param("userToName");
        const orderNotifs =
            await orderHndlr.findNotificationsByUserTo.bind(orderHndlr)(
                userToName
            );

        return c.json(
            {
                message: "Notifications",
                notifications: orderNotifs
            },
            StatusCodes.OK
        );
    });
    api.put("/notification/mark-as-read", async (c: Context) => {
        const { notificationId } = await c.req.json<{
            notificationId: string;
        }>();
        const orderNotif =
            await orderHndlr.updateNotificationReadStatus.bind(orderHndlr)(
                notificationId
            );

        return c.json(
            {
                message: "Notification read status updated successfully.",
                notification: orderNotif
            },
            StatusCodes.OK
        );
    });
}

async function verifyGatewayRequest(c: Context, next: Next): Promise<void> {
    const token = c.req.header("gatewayToken");
    if (!token) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        );
    }

    try {
        const payload: { id: string; iat: number } = jwt.verify(
            token,
            GATEWAY_JWT_TOKEN!
        ) as {
            id: string;
            iat: number;
        };

        c.set("gatewayToken", payload);
        await next();
    } catch (error) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        );
    }
}
