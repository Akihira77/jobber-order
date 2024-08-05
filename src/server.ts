import http from "http"
import { createVerifier } from "fast-jwt"
import {
    CustomError,
    IAuthPayload,
    winstonLogger
} from "@Akihira77/jobber-shared"
import {
    API_GATEWAY_URL,
    ELASTIC_SEARCH_URL,
    JWT_TOKEN,
    NODE_ENV,
    PORT
} from "@order/config"
import { Context, Hono, Next } from "hono"
import { cors } from "hono/cors"
import { compress } from "hono/compress"
import { timeout } from "hono/timeout"
import { csrf } from "hono/csrf"
import { secureHeaders } from "hono/secure-headers"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"
import { appRoutes } from "@order/routes"
import { Logger } from "winston"
import { StatusCodes } from "http-status-codes"
import { StatusCode } from "hono/utils/http-status"
import { serve } from "@hono/node-server"
import { logger } from "hono/logger"
import { OrderQueue } from "./queues/order.queue"
import { ElasticSearchClient } from "./elasticsearch"
import { App } from "uWebSockets.js"
import { DisconnectReason, Server, Socket } from "socket.io"
import { ServerType } from "@hono/node-server/dist/types"
import { Channel } from "amqplib"

export let pubMQOrderObject: OrderQueue
const LIMIT_TIMEOUT = 3 * 1000 // 3s

export async function setupHono(
    app: Hono,
    socket: Server,
    logger?: (location?: string) => Logger
): Promise<Hono> {
    if (!logger) {
        logger = (location?: string) =>
            winstonLogger(
                `${ELASTIC_SEARCH_URL}`,
                location ?? "server.ts",
                "debug"
            )
    }

    const { queue, ch } = await startQueues(socket, logger)
    orderErrorHandler(app)
    securityMiddleware(app)
    standardMiddleware(app)
    routesMiddleware(app, socket, queue, ch, logger)

    return app
}

export async function start(
    app: Hono,
    logger: (moduleName?: string) => Logger
): Promise<void> {
    startElasticSearch(logger)
    const socket = await createSocketIO(logger)

    socket.engine.on("connection", (rawSocket) => {
        rawSocket.request = null
    })

    socket.on("connection", (socket: Socket) => {
        logger("server.ts - startServer()").info(
            `Socket receive a connection with id: ${socket.id}`
        )

        socket.on("disconnect", (reason: DisconnectReason) => {
            logger("server.ts - startServer()").info(
                `Socket with id: ${socket.id} disconnected with reason: ${reason.toString()}`
            )
        })
    })

    app = await setupHono(app, socket, logger)
    startServer(app, logger)
}

function securityMiddleware(app: Hono): void {
    app.use(
        timeout(LIMIT_TIMEOUT, () => {
            return new HTTPException(StatusCodes.REQUEST_TIMEOUT, {
                message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
            })
        })
    )
    app.use(
        secureHeaders({
            xXssProtection: "1"
        })
    )
    app.use(csrf({ origin: [`${API_GATEWAY_URL}`] }))
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    )

    app.use(async (c: Context, next: Next) => {
        const authorization = c.req.header("authorization")
        if (authorization && authorization !== "") {
            const authBearer = authorization.split(" ")[1]
            const verifier = createVerifier({
                key: `${JWT_TOKEN}`,
                cache: true,
                cacheTTL: 30 * 60 * 1000
            })
            const payload = verifier(authBearer) as IAuthPayload
            c.set("currentUser", payload)
        }

        await next()
    })
}

function standardMiddleware(app: Hono): void {
    if (NODE_ENV !== "production") {
        app.use(logger())
    }
    app.use(compress())
    app.use(
        bodyLimit({
            maxSize: 2 * 100 * 1000 * 1024, //200mb
            onError(c: Context) {
                return c.text(
                    "Your request is too big",
                    StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE
                )
            }
        })
    )

    //    app.use(
    //        rateLimiter({
    //            windowMs: 10 * 60 * 1000, // 600s
    //            limit: 100,
    //            standardHeaders: "draft-6",
    //            keyGenerator: (c: Context) => {
    //                return c.req.url
    //            }
    //        })
    //    )
}

function routesMiddleware(
    app: Hono,
    socket: Server,
    queue: OrderQueue,
    ch: Channel,
    logger: (moduleName: string) => Logger
): void {
    appRoutes(app, socket, queue, ch, logger)
}

async function startQueues(
    socket: Server,
    logger: (moduleName: string) => Logger
): Promise<{ queue: OrderQueue; ch: Channel }> {
    const queue = new OrderQueue(socket, logger)
    const pub = await queue.createConnection()
    const consume = await queue.createConnection()
    const pubCh = await pub.createChannel()
    const consumeCh = await consume.createChannel()

    pubMQOrderObject = queue
    queue.consumeReviewFanoutMessage(consumeCh)

    return { queue: queue, ch: pubCh }
}

export async function startElasticSearch(
    logger: (moduleName: string) => Logger
): Promise<ElasticSearchClient> {
    const elastic = new ElasticSearchClient(logger)
    await elastic.checkConnection()

    return elastic
}

function orderErrorHandler(app: Hono): void {
    app.notFound((c) => {
        return c.text("Route path does not found", StatusCodes.NOT_FOUND)
    })

    app.onError((err: Error, c: Context) => {
        if (err instanceof CustomError) {
            console.log(err)
            return c.json(
                err.serializeErrors(),
                (err.statusCode as StatusCode) ??
                    StatusCodes.INTERNAL_SERVER_ERROR
            )
        } else if (err instanceof HTTPException) {
            return err.getResponse()
        }

        return c.text(
            "Unexpected error occured. Please try again",
            StatusCodes.INTERNAL_SERVER_ERROR
        )
    })
}

async function startServer(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    try {
        startHttpServer(app, logger)
    } catch (error) {
        console.log(error)
    }
}

export async function createSocketIO(
    logger: (moduleName: string) => Logger
): Promise<Server> {
    const uwsApp = App()
    const io: Server = new Server({
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        },
        transports: ["websocket"]
    })

    io.attachApp(uwsApp)
    // console.log("OrderService Socket connected");
    logger("server.ts - createSocketIO()").info("OrderService Socket connected")

    io.engine.on("connection", (rawSocket) => {
        rawSocket.request = null
    })

    uwsApp.listen(Number(PORT) - 1000, (token) => {
        if (!token) {
            logger("server.ts - createSocketIO()").warn(
                "Port is already in use"
            )
        } else {
            logger("server.ts - createSocketIO()").info(
                `SocketIO x uWebSockets.js is running on port ${Number(PORT) - 1000}`
            )
        }
    })
    return io
}

function startHttpServer(
    hono: Hono,
    logger: (moduleName: string) => Logger
): ServerType {
    try {
        // console.log(`Order server has started with pid ${process.pid}`);
        logger("server.ts - startHttpServer()").info(
            `OrderService has started with pid ${process.pid}`
        )

        const server = serve(
            {
                fetch: hono.fetch,
                port: Number(PORT),
                createServer: http.createServer
            },
            () => {
                // console.log(`Order server running on port ${PORT}`);
                logger("server.ts - startHttpServer()").info(
                    `OrderService running on port ${PORT}`
                )
            }
        )

        return server
    } catch (error) {
        logger("server.ts - startHttpServer()").error(
            "OrderService startHttpServer() method error:",
            error
        )

        process.exit(1)
    }
}
