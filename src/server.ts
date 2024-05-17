import http from "http";
import "express-async-errors";

import compression from "compression";
import jwt from "jsonwebtoken";
import {
    CustomError,
    IAuthPayload,
    IErrorResponse
} from "@Akihira77/jobber-shared";
import {
    API_GATEWAY_URL,
    JWT_TOKEN,
    logger,
    NODE_ENV,
    PORT
} from "@order/config";
import {
    Application,
    NextFunction,
    Request,
    Response,
    json,
    urlencoded
} from "express";
import hpp from "hpp";
import helmet from "helmet";
import cors from "cors";
import { checkConnection } from "@order/elasticsearch";
import { appRoutes } from "@order/routes";
import { createConnection } from "@order/queues/connection";
import { Channel } from "amqplib";
import { Server, Socket } from "socket.io";
import { consumeReviewFanoutMessage } from "@order/queues/order.consumer";
import { StatusCodes } from "http-status-codes";

export let orderChannel: Channel;
export let socketIOOrderObject: Server;

export function start(app: Application): void {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    orderErrorHandler(app);
    startServer(app);
}

function securityMiddleware(app: Application): void {
    app.set("trust proxy", 1);
    app.use(hpp());
    app.use(helmet());
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    );

    app.use((req: Request, _res: Response, next: NextFunction) => {
        // console.log(req.headers);
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const payload = jwt.verify(token, JWT_TOKEN!) as IAuthPayload;

            req.currentUser = payload;
        }
        next();
    });
}

function standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: "200mb" }));
    app.use(urlencoded({ extended: true, limit: "200mb" }));
}

function routesMiddleware(app: Application): void {
    appRoutes(app);
}

async function startQueues(): Promise<void> {
    orderChannel = (await createConnection()) as Channel;
    await consumeReviewFanoutMessage(orderChannel);
}

function startElasticSearch(): void {
    checkConnection();
}

function orderErrorHandler(app: Application): void {
    app.use(
        (
            error: IErrorResponse,
            _req: Request,
            res: Response,
            next: NextFunction
        ) => {
            if (error instanceof CustomError) {
                res.status(
                    error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR
                ).json(error.serializeErrors());
            }
            next();
        }
    );
}

async function startServer(app: Application): Promise<void> {
    try {
        const httpServer: http.Server = new http.Server(app);
        socketIOOrderObject = await createSocketIO(httpServer);

        socketIOOrderObject.on("connection", (socket: Socket) => {
            logger("server.ts - startServer()").info(
                `Socket receive a connection with id: ${socket.id}`
            );
        });
        startHttpServer(httpServer);
    } catch (error) {
        console.log(error);
    }
}

async function createSocketIO(httpServer: http.Server): Promise<Server> {
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

function startHttpServer(httpServer: http.Server): void {
    try {
        // console.log(`Order server has started with pid ${process.pid}`);
        logger("server.ts - startHttpServer()").info(
            `OrderService has started with pid ${process.pid}`
        );

        if (NODE_ENV !== "test") {
            httpServer.listen(Number(PORT), () => {
                // console.log(`Order server running on port ${PORT}`);
                logger("server.ts - startHttpServer()").info(
                    `OrderService running on port ${PORT}`
                );
            });
        }
    } catch (error) {
        logger("server.ts - startHttpServer()").error(
            "OrderService startHttpServer() method error:",
            error
        );
    }
}
