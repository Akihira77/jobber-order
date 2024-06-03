import http from "http";

import {
    CustomError,
    IAuthPayload,
    NotAuthorizedError
} from "@Akihira77/jobber-shared";
import { API_GATEWAY_URL, JWT_TOKEN, PORT } from "@order/config";
import jwt from "jsonwebtoken";
import { appRoutes } from "@order/routes";
import { Server, Socket } from "socket.io";
import { StatusCodes } from "http-status-codes";
import { Context, Hono, Next } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { timeout } from "hono/timeout";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { Logger } from "winston";

import { ElasticSearchClient } from "./elasticsearch";
import { OrderQueue } from "./queues/order.queue";
import { StatusCode } from "hono/utils/http-status";
import { serve } from "@hono/node-server";
import { ServerType } from "@hono/node-server/dist/types";
import { HTTPException } from "hono/http-exception";
import { rateLimiter } from "hono-rate-limiter";

export let socketIOOrderObject: Server;
const LIMIT_TIMEOUT = 2 * 1000; // 2s

export async function start(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    const orderQueue = await startQueues(logger);
    await startElasticSearch(logger);
    securityMiddleware(app);
    orderErrorHandler(app);
    standardMiddleware(app);
    routesMiddleware(app, orderQueue, logger);
    startServer(app, logger);
}

function securityMiddleware(app: Hono): void {
    app.use(
        timeout(LIMIT_TIMEOUT, () => {
            return new HTTPException(StatusCodes.REQUEST_TIMEOUT, {
                message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
            });
        })
    );
    app.use(secureHeaders());
    app.use(csrf());
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    );

    app.use(async (c: Context, next: Next) => {
        if (c.req.path == "/order-health") {
            await next();
            return;
        }

        const authorization = c.req.header("authorization");
        if (!authorization || authorization === "") {
            throw new NotAuthorizedError(
                "unauthenticated request",
                "Order Service"
            );
        }

        const token = authorization.split(" ")[1];
        const payload = jwt.verify(token, JWT_TOKEN!) as IAuthPayload;

        c.set("currentUser", payload);
        await next();
    });
}

function standardMiddleware(app: Hono): void {
    app.use(compress());
    app.use(
        bodyLimit({
            maxSize: 2 * 100 * 1000 * 1024, //200mb
            onError(c: Context) {
                return c.text(
                    "Your request is too big",
                    StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE
                );
            }
        })
    );

    const generateRandomNumber = (length: number): number => {
        return (
            Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
            Math.pow(10, length - 1)
        );
    };

    app.use(
        rateLimiter({
            windowMs: 1 * 60 * 1000, //60s
            limit: 10,
            standardHeaders: "draft-6",
            keyGenerator: () => generateRandomNumber(12).toString()
        })
    );
}

function routesMiddleware(
    app: Hono,
    queue: OrderQueue,
    logger: (moduleName: string) => Logger
): void {
    appRoutes(app, queue, logger);
}

async function startQueues(
    logger: (moduleName: string) => Logger
): Promise<OrderQueue> {
    const queue = new OrderQueue(null, logger);
    await queue.createConnection();
    queue.consumeReviewFanoutMessage();

    return queue;
}

async function startElasticSearch(
    logger: (moduleName: string) => Logger
): Promise<void> {
    const elasticClient = new ElasticSearchClient(logger);
    await elasticClient.checkConnection();
}

function orderErrorHandler(app: Hono): void {
    app.notFound((c) => {
        return c.text("Route path is not found", StatusCodes.NOT_FOUND);
    });

    app.onError((err: Error, c: Context) => {
        if (err instanceof CustomError) {
            return c.json(
                err.serializeErrors(),
                (err.statusCode as StatusCode) ??
                    StatusCodes.INTERNAL_SERVER_ERROR
            );
        }

        return c.text(
            "Unexpected error occured. Please try again",
            StatusCodes.INTERNAL_SERVER_ERROR
        );
    });
}

async function startServer(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    try {
        const server = startHttpServer(app, logger);
        socketIOOrderObject = await createSocketIO(
            server as http.Server,
            logger
        );

        socketIOOrderObject.on("connection", (socket: Socket) => {
            logger("server.ts - startServer()").info(
                `Socket receive a connection with id: ${socket.id}`
            );
        });
    } catch (error) {
        console.log(error);
    }
}

async function createSocketIO(
    httpServer: http.Server,
    logger: (moduleName: string) => Logger
): Promise<Server> {
    const io: Server = new Server(httpServer, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        }
    });

    // console.log("OrderService Socket connected");
    logger("server.ts - createSocketIO()").info(
        "OrderService Socket connected"
    );

    return io;
}

function startHttpServer(
    hono: Hono,
    logger: (moduleName: string) => Logger
): ServerType {
    try {
        // console.log(`Order server has started with pid ${process.pid}`);
        logger("server.ts - startHttpServer()").info(
            `OrderService has started with pid ${process.pid}`
        );

        const server = serve({ fetch: hono.fetch, port: Number(PORT) }, () => {
            // console.log(`Order server running on port ${PORT}`);
            logger("server.ts - startHttpServer()").info(
                `OrderService running on port ${PORT}`
            );
        });

        return server;
    } catch (error) {
        logger("server.ts - startHttpServer()").error(
            "OrderService startHttpServer() method error:",
            error
        );

        process.exit(1);
    }
}
