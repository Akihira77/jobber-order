"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubMQOrderObject = void 0;
exports.setupHono = setupHono;
exports.start = start;
exports.startElasticSearch = startElasticSearch;
exports.createSocketIO = createSocketIO;
const http_1 = __importDefault(require("http"));
const fast_jwt_1 = require("fast-jwt");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("./config");
const cors_1 = require("hono/cors");
const compress_1 = require("hono/compress");
const timeout_1 = require("hono/timeout");
const csrf_1 = require("hono/csrf");
const secure_headers_1 = require("hono/secure-headers");
const body_limit_1 = require("hono/body-limit");
const http_exception_1 = require("hono/http-exception");
const routes_1 = require("./routes");
const http_status_codes_1 = require("http-status-codes");
const node_server_1 = require("@hono/node-server");
const logger_1 = require("hono/logger");
const order_queue_1 = require("./queues/order.queue");
const elasticsearch_1 = require("./elasticsearch");
const uWebSockets_js_1 = require("uWebSockets.js");
const socket_io_1 = require("socket.io");
const LIMIT_TIMEOUT = 3 * 1000; // 3s
function setupHono(app, socket, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!logger) {
            logger = (location) => (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, location !== null && location !== void 0 ? location : "server.ts", "debug");
        }
        const { queue, ch } = yield startQueues(socket, logger);
        orderErrorHandler(app);
        securityMiddleware(app);
        standardMiddleware(app);
        routesMiddleware(app, socket, queue, ch, logger);
        return app;
    });
}
function start(app, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        startElasticSearch(logger);
        const socket = yield createSocketIO(logger);
        socket.engine.on("connection", (rawSocket) => {
            rawSocket.request = null;
        });
        socket.on("connection", (socket) => {
            logger("server.ts - startServer()").info(`Socket receive a connection with id: ${socket.id}`);
            socket.on("disconnect", (reason) => {
                logger("server.ts - startServer()").info(`Socket with id: ${socket.id} disconnected with reason: ${reason.toString()}`);
            });
        });
        app = yield setupHono(app, socket, logger);
        startServer(app, logger);
    });
}
function securityMiddleware(app) {
    app.use((0, timeout_1.timeout)(LIMIT_TIMEOUT, () => {
        return new http_exception_1.HTTPException(http_status_codes_1.StatusCodes.REQUEST_TIMEOUT, {
            message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
        });
    }));
    app.use((0, secure_headers_1.secureHeaders)({
        xXssProtection: "1"
    }));
    app.use((0, csrf_1.csrf)({ origin: [`${config_1.API_GATEWAY_URL}`] }));
    app.use((0, cors_1.cors)({
        origin: [`${config_1.API_GATEWAY_URL}`],
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }));
    app.use((c, next) => __awaiter(this, void 0, void 0, function* () {
        const authorization = c.req.header("authorization");
        if (authorization && authorization !== "") {
            const authBearer = authorization.split(" ")[1];
            const verifier = (0, fast_jwt_1.createVerifier)({
                key: `${config_1.JWT_TOKEN}`,
                cache: true,
                cacheTTL: 30 * 60 * 1000
            });
            const payload = verifier(authBearer);
            c.set("currentUser", payload);
        }
        yield next();
    }));
}
function standardMiddleware(app) {
    if (config_1.NODE_ENV !== "production") {
        app.use((0, logger_1.logger)());
    }
    app.use((0, compress_1.compress)());
    app.use((0, body_limit_1.bodyLimit)({
        maxSize: 2 * 100 * 1000 * 1024, //200mb
        onError(c) {
            return c.text("Your request is too big", http_status_codes_1.StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE);
        }
    }));
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
function routesMiddleware(app, socket, queue, ch, logger) {
    (0, routes_1.appRoutes)(app, socket, queue, ch, logger);
}
function startQueues(socket, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const queue = new order_queue_1.OrderQueue(socket, logger);
        const pub = yield queue.createConnection();
        const consume = yield queue.createConnection();
        const pubCh = yield pub.createChannel();
        const consumeCh = yield consume.createChannel();
        exports.pubMQOrderObject = queue;
        queue.consumeReviewFanoutMessage(consumeCh);
        return { queue: queue, ch: pubCh };
    });
}
function startElasticSearch(logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const elastic = new elasticsearch_1.ElasticSearchClient(logger);
        yield elastic.checkConnection();
        return elastic;
    });
}
function orderErrorHandler(app) {
    app.notFound((c) => {
        return c.text("Route path does not found", http_status_codes_1.StatusCodes.NOT_FOUND);
    });
    app.onError((err, c) => {
        var _a;
        if (err instanceof jobber_shared_1.CustomError) {
            console.log(err);
            return c.json(err.serializeErrors(), (_a = err.statusCode) !== null && _a !== void 0 ? _a : http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        else if (err instanceof http_exception_1.HTTPException) {
            return err.getResponse();
        }
        return c.text("Unexpected error occured. Please try again", http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    });
}
function startServer(app, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            startHttpServer(app, logger);
        }
        catch (error) {
            console.log(error);
        }
    });
}
function createSocketIO(logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const uwsApp = (0, uWebSockets_js_1.App)();
        const io = new socket_io_1.Server({
            cors: {
                origin: ["*"],
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                credentials: true
            },
            transports: ["websocket"]
        });
        io.attachApp(uwsApp);
        // console.log("OrderService Socket connected");
        logger("server.ts - createSocketIO()").info("OrderService Socket connected");
        io.engine.on("connection", (rawSocket) => {
            rawSocket.request = null;
        });
        uwsApp.listen(Number(config_1.PORT) - 1000, (token) => {
            if (!token) {
                logger("server.ts - createSocketIO()").warn("Port is already in use");
            }
            else {
                logger("server.ts - createSocketIO()").info(`SocketIO x uWebSockets.js is running on port ${Number(config_1.PORT) - 1000}`);
            }
        });
        return io;
    });
}
function startHttpServer(hono, logger) {
    try {
        // console.log(`Order server has started with pid ${process.pid}`);
        logger("server.ts - startHttpServer()").info(`OrderService has started with pid ${process.pid}`);
        const server = (0, node_server_1.serve)({
            fetch: hono.fetch,
            port: Number(config_1.PORT),
            createServer: http_1.default.createServer
        }, () => {
            // console.log(`Order server running on port ${PORT}`);
            logger("server.ts - startHttpServer()").info(`OrderService running on port ${config_1.PORT}`);
        });
        return server;
    }
    catch (error) {
        logger("server.ts - startHttpServer()").error("OrderService startHttpServer() method error:", error);
        process.exit(1);
    }
}
//# sourceMappingURL=server.js.map