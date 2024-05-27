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
exports.start = exports.socketIOOrderObject = exports.orderChannel = void 0;
const http_1 = __importDefault(require("http"));
require("express-async-errors");
const compression_1 = __importDefault(require("compression"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("./config");
const express_1 = require("express");
const hpp_1 = __importDefault(require("hpp"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const elasticsearch_1 = require("./elasticsearch");
const routes_1 = require("./routes");
const connection_1 = require("./queues/connection");
const socket_io_1 = require("socket.io");
const order_consumer_1 = require("./queues/order.consumer");
const http_status_codes_1 = require("http-status-codes");
const morgan_1 = __importDefault(require("morgan"));
function start(app) {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    orderErrorHandler(app);
    startServer(app);
}
exports.start = start;
function securityMiddleware(app) {
    app.set("trust proxy", 1);
    app.use((0, hpp_1.default)());
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: [`${config_1.API_GATEWAY_URL}`],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }));
    app.use((req, _res, next) => {
        // console.log(req.headers);
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_TOKEN);
            req.currentUser = payload;
        }
        next();
    });
}
function standardMiddleware(app) {
    app.use((0, compression_1.default)());
    app.use((0, express_1.json)({ limit: "200mb" }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: "200mb" }));
    app.use((0, morgan_1.default)("dev"));
}
function routesMiddleware(app) {
    (0, routes_1.appRoutes)(app);
}
function startQueues() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.orderChannel = (yield (0, connection_1.createConnection)());
        yield (0, order_consumer_1.consumeReviewFanoutMessage)(exports.orderChannel);
    });
}
function startElasticSearch() {
    (0, elasticsearch_1.checkConnection)();
}
function orderErrorHandler(app) {
    app.use((error, _req, res, next) => {
        var _a;
        if (error instanceof jobber_shared_1.CustomError) {
            res.status((_a = error.statusCode) !== null && _a !== void 0 ? _a : http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json(error.serializeErrors());
        }
        next();
    });
}
function startServer(app) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const httpServer = new http_1.default.Server(app);
            exports.socketIOOrderObject = yield createSocketIO(httpServer);
            exports.socketIOOrderObject.on("connection", (socket) => {
                (0, config_1.logger)("server.ts - startServer()").info(`Socket receive a connection with id: ${socket.id}`);
            });
            startHttpServer(httpServer);
        }
        catch (error) {
            console.log(error);
        }
    });
}
function createSocketIO(httpServer) {
    return __awaiter(this, void 0, void 0, function* () {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: ["*"],
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }
        });
        // console.log("OrderService Socket connected");
        (0, config_1.logger)("server.ts - createSocketIO()").info("OrderService Socket connected");
        return io;
    });
}
function startHttpServer(httpServer) {
    try {
        // console.log(`Order server has started with pid ${process.pid}`);
        (0, config_1.logger)("server.ts - startHttpServer()").info(`OrderService has started with pid ${process.pid}`);
        if (config_1.NODE_ENV !== "test") {
            httpServer.listen(Number(config_1.PORT), () => {
                // console.log(`Order server running on port ${PORT}`);
                (0, config_1.logger)("server.ts - startHttpServer()").info(`OrderService running on port ${config_1.PORT}`);
            });
        }
    }
    catch (error) {
        (0, config_1.logger)("server.ts - startHttpServer()").error("OrderService startHttpServer() method error:", error);
    }
}
//# sourceMappingURL=server.js.map