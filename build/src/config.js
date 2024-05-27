"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.exchangeNamesAndRoutingKeys = exports.cloudinaryConfig = exports.ENABLE_APM = exports.ELASTIC_APM_SERVICE_NAME = exports.ELASTIC_APM_SERVER_URL = exports.ELASTIC_APM_SECRET_TOKEN = exports.STRIPE_API_PRIVATE_KEY = exports.DATABASE_URL = exports.RABBITMQ_ENDPOINT = exports.NODE_ENV = exports.JWT_TOKEN = exports.API_GATEWAY_URL = exports.GATEWAY_JWT_TOKEN = exports.ELASTIC_SEARCH_URL = exports.CLIENT_URL = exports.CLOUD_NAME = exports.CLOUD_API_SECRET = exports.CLOUD_API_KEY = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config({ path: "./.env" });
}
else {
    dotenv_1.default.config();
}
_a = process.env, exports.PORT = _a.PORT, exports.CLOUD_API_KEY = _a.CLOUD_API_KEY, exports.CLOUD_API_SECRET = _a.CLOUD_API_SECRET, exports.CLOUD_NAME = _a.CLOUD_NAME, exports.CLIENT_URL = _a.CLIENT_URL, exports.ELASTIC_SEARCH_URL = _a.ELASTIC_SEARCH_URL, exports.GATEWAY_JWT_TOKEN = _a.GATEWAY_JWT_TOKEN, exports.API_GATEWAY_URL = _a.API_GATEWAY_URL, exports.JWT_TOKEN = _a.JWT_TOKEN, exports.NODE_ENV = _a.NODE_ENV, exports.RABBITMQ_ENDPOINT = _a.RABBITMQ_ENDPOINT, exports.DATABASE_URL = _a.DATABASE_URL, exports.STRIPE_API_PRIVATE_KEY = _a.STRIPE_API_PRIVATE_KEY, exports.ELASTIC_APM_SECRET_TOKEN = _a.ELASTIC_APM_SECRET_TOKEN, exports.ELASTIC_APM_SERVER_URL = _a.ELASTIC_APM_SERVER_URL, exports.ELASTIC_APM_SERVICE_NAME = _a.ELASTIC_APM_SERVICE_NAME, exports.ENABLE_APM = _a.ENABLE_APM;
if (exports.NODE_ENV === "production" && exports.ENABLE_APM == "1") {
    require("elastic-apm-node").start({
        serviceName: `${exports.ELASTIC_APM_SERVICE_NAME}`,
        serverUrl: exports.ELASTIC_APM_SERVER_URL,
        secretToken: exports.ELASTIC_APM_SECRET_TOKEN,
        enironment: exports.NODE_ENV,
        active: true,
        captureBody: "all",
        errorOnAbortedRequests: true,
        captureErrorLogStackTraces: "always"
    });
}
const cloudinaryConfig = () => cloudinary_1.default.v2.config({
    cloud_name: exports.CLOUD_NAME,
    api_key: exports.CLOUD_API_KEY,
    api_secret: exports.CLOUD_API_SECRET
});
exports.cloudinaryConfig = cloudinaryConfig;
exports.exchangeNamesAndRoutingKeys = {
    notificationService: {
        email: {
            exchangeName: "jobber-email-notification",
            routingKey: "auth-email"
        },
        order: {
            exchangeName: "jobber-order-notification",
            routingKey: "order-email"
        }
    },
    usersService: {
        buyer: {
            exchangeName: "jobber-buyer-update",
            routingKey: "user-buyer"
        },
        seller: {
            exchangeName: "jobber-seller-update",
            routingKey: "user-seller"
        }
    },
    reviewService: {
        review: {
            exchangeName: "jobber-review"
        }
    },
    gigService: {
        updateGig: {
            exchangeName: "jobber-update-gig",
            routingKey: "update-gig"
        },
        getSellers: {
            exchangeName: "jobber-gig",
            routingKey: "get-sellers"
        },
        seed: {
            exchangeName: "jobber-seed-gig",
            routingKey: "receive-sellers"
        }
    }
};
const logger = (moduleName) => (0, jobber_shared_1.winstonLogger)(`${exports.ELASTIC_SEARCH_URL}`, moduleName !== null && moduleName !== void 0 ? moduleName : "Order Service", "debug");
exports.logger = logger;
//# sourceMappingURL=config.js.map