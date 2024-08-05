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
const database_1 = require("./database");
const server_1 = require("./server");
const cloudinary_1 = __importDefault(require("cloudinary"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const hono_1 = require("hono");
const config_1 = require("./config");
const node_os_1 = __importDefault(require("node:os"));
const node_cluster_1 = __importDefault(require("node:cluster"));
const events_1 = require("events");
events_1.EventEmitter.setMaxListeners(20);
process.once("SIGINT", () => {
    process.exit(1);
});
process.once("SIGTERM", () => {
    process.exit(1);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const logger = (moduleName) => (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, moduleName !== null && moduleName !== void 0 ? moduleName : "Order Service", "debug");
    try {
        cloudinary_1.default.v2.config({
            cloud_name: config_1.CLOUD_NAME,
            api_key: config_1.CLOUD_API_KEY,
            api_secret: config_1.CLOUD_API_SECRET
        });
        const db = yield (0, database_1.databaseConnection)();
        const app = new hono_1.Hono();
        (0, server_1.start)(app, logger);
        process.once("exit", () => __awaiter(void 0, void 0, void 0, function* () {
            yield db.connection.close();
        }));
    }
    catch (error) {
        logger("app.ts - main()").error(error);
        process.exit(1);
    }
});
if (config_1.NODE_ENV === "production") {
    let numCPUs = Math.floor(node_os_1.default.availableParallelism() / 2);
    numCPUs = 4;
    if (node_cluster_1.default.isPrimary) {
        for (let i = 0; i < numCPUs; i++) {
            node_cluster_1.default.fork();
        }
        node_cluster_1.default.on("exit", (worker, code, signal) => {
            console.log(`worker process ${worker.process.pid} died, Restarting...`, code, signal);
            node_cluster_1.default.fork();
        });
    }
    else {
        main();
    }
}
else {
    main();
}
//# sourceMappingURL=app.js.map