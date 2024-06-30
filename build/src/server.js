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
exports.start = exports.setupHono = exports.socketIOOrderObject = void 0;
const http_1 = __importDefault(require("http"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("./config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const routes_1 = require("./routes");
const socket_io_1 = require("socket.io");
const http_status_codes_1 = require("http-status-codes");
const cors_1 = require("hono/cors");
const compress_1 = require("hono/compress");
const timeout_1 = require("hono/timeout");
const csrf_1 = require("hono/csrf");
const secure_headers_1 = require("hono/secure-headers");
const body_limit_1 = require("hono/body-limit");
const node_server_1 = require("@hono/node-server");
const http_exception_1 = require("hono/http-exception");
const hono_rate_limiter_1 = require("hono-rate-limiter");
const logger_1 = require("hono/logger");
const order_queue_1 = require("./queues/order.queue");
const elasticsearch_1 = require("./elasticsearch");
const LIMIT_TIMEOUT = 2 * 1000; // 2s
function setupHono(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = (moduleName) => (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, moduleName !== null && moduleName !== void 0 ? moduleName : "server.ts", "debug");
        const orderQueue = yield startQueues(logger);
        orderErrorHandler(app);
        securityMiddleware(app);
        standardMiddleware(app);
        routesMiddleware(app, orderQueue, logger);
        return app;
    });
}
exports.setupHono = setupHono;
function start(app, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        yield startElasticSearch(logger);
        app = yield setupHono(app);
        startServer(app, logger);
    });
}
exports.start = start;
function securityMiddleware(app) {
    app.use((0, timeout_1.timeout)(LIMIT_TIMEOUT, () => {
        return new http_exception_1.HTTPException(http_status_codes_1.StatusCodes.REQUEST_TIMEOUT, {
            message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
        });
    }));
    app.use((0, secure_headers_1.secureHeaders)({ xXssProtection: true }));
    app.use((0, csrf_1.csrf)({ origin: [`${config_1.API_GATEWAY_URL}`] }));
    app.use((0, cors_1.cors)({
        origin: [`${config_1.API_GATEWAY_URL}`],
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }));
    app.use((c, next) => __awaiter(this, void 0, void 0, function* () {
        const authorization = c.req.header("authorization");
        if (authorization && authorization !== "") {
            const token = authorization.split(" ")[1];
            const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_TOKEN);
            c.set("currentUser", payload);
        }
        yield next();
    }));
}
function standardMiddleware(app) {
    app.use((0, logger_1.logger)());
    app.use((0, compress_1.compress)());
    app.use((0, body_limit_1.bodyLimit)({
        maxSize: 2 * 100 * 1000 * 1024, //200mb
        onError(c) {
            return c.text("Your request is too big", http_status_codes_1.StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE);
        }
    }));
    const generateRandomNumber = (length) => {
        return (Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
            Math.pow(10, length - 1));
    };
    app.use((0, hono_rate_limiter_1.rateLimiter)({
        windowMs: 1 * 60 * 1000, //60s
        limit: 10,
        standardHeaders: "draft-6",
        keyGenerator: () => generateRandomNumber(12).toString()
    }));
}
function routesMiddleware(app, queue, logger) {
    (0, routes_1.appRoutes)(app, queue, logger);
}
function startQueues(logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const queue = new order_queue_1.OrderQueue(null, logger);
        yield queue.createConnection();
        queue.consumeReviewFanoutMessage();
        return queue;
    });
}
function startElasticSearch(logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const elasticClient = new elasticsearch_1.ElasticSearchClient(logger);
        yield elasticClient.checkConnection();
    });
}
function orderErrorHandler(app) {
    app.notFound((c) => {
        return c.text("Route path is not found", http_status_codes_1.StatusCodes.NOT_FOUND);
    });
    app.onError((err, c) => {
        var _a;
        if (err instanceof jobber_shared_1.CustomError) {
            return c.json(err.serializeErrors(), (_a = err.statusCode) !== null && _a !== void 0 ? _a : http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return c.text("Unexpected error occured. Please try again", http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    });
}
function startServer(app, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const server = startHttpServer(app, logger);
            exports.socketIOOrderObject = yield createSocketIO(server, logger);
            exports.socketIOOrderObject === null || exports.socketIOOrderObject === void 0 ? void 0 : exports.socketIOOrderObject.on("connection", (socket) => {
                logger("server.ts - startServer()").info(`Socket receive a connection with id: ${socket.id}`);
                socket.on("disconnect", () => {
                    logger("server.ts - startServer()").info(`Connection with id: ${socket.id} disconnected`);
                    destroy();
                });
                let alive = Date.now();
                socket.on("am_alive", () => {
                    alive = Date.now();
                });
                const intv = setInterval(() => {
                    if (Date.now() > alive + 20000) {
                        //sever checks if clients has no activity in last 20s
                        destroy();
                        clearInterval(intv);
                    }
                }, 10000);
                function destroy() {
                    try {
                        socket.disconnect();
                        socket.removeAllListeners();
                    }
                    catch (_a) { }
                }
            });
        }
        catch (error) {
            console.log(error);
        }
    });
}
function createSocketIO(httpServer, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: ["*"],
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                credentials: true
            }
        });
        // console.log("OrderService Socket connected");
        logger("server.ts - createSocketIO()").info("OrderService Socket connected");
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